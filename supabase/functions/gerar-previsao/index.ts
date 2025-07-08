import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VendaData {
  data_dia: string
  total_venda_dia_kg: number
  promocao: boolean
  feriado: boolean
}

// Implementação simplificada do modelo SARIMAX em TypeScript
class SimpleTimeSeriesModel {
  private data: number[]
  private seasonality: number
  
  constructor(data: number[], seasonality = 7) {
    this.data = data
    this.seasonality = seasonality
  }

  // Método simplificado para previsão baseado em média móvel com sazonalidade
  forecast(steps: number): { mean: number[], lower: number[], upper: number[] } {
    const mean: number[] = []
    const lower: number[] = []
    const upper: number[] = []
    
    for (let i = 0; i < steps; i++) {
      // Média dos últimos valores sazonais
      const seasonalPattern = this.getSeasonalPattern(i)
      const trend = this.getTrend()
      
      const forecast = seasonalPattern + trend
      const confidence = forecast * 0.2 // 20% de intervalo de confiança
      
      mean.push(Math.max(0, forecast))
      lower.push(Math.max(0, forecast - confidence))
      upper.push(forecast + confidence)
    }
    
    return { mean, lower, upper }
  }

  private getSeasonalPattern(step: number): number {
    const recentData = this.data.slice(-this.seasonality * 4) // Últimas 4 semanas
    const seasonalIndex = step % this.seasonality
    
    // Média dos valores no mesmo dia da semana
    const seasonalValues = []
    for (let i = seasonalIndex; i < recentData.length; i += this.seasonality) {
      seasonalValues.push(recentData[i])
    }
    
    return seasonalValues.length > 0 
      ? seasonalValues.reduce((a, b) => a + b, 0) / seasonalValues.length
      : this.data.slice(-7).reduce((a, b) => a + b, 0) / 7
  }

  private getTrend(): number {
    if (this.data.length < 14) return 0
    
    const recent = this.data.slice(-14, -7).reduce((a, b) => a + b, 0) / 7
    const current = this.data.slice(-7).reduce((a, b) => a + b, 0) / 7
    
    return (current - recent) * 0.5 // Trend suavizado
  }

  calculateMetrics(actual: number[], predicted: number[]): { mape: number, rmse: number } {
    if (actual.length !== predicted.length || actual.length === 0) {
      return { mape: 0, rmse: 0 }
    }

    // MAPE
    let mapeSum = 0
    let validPoints = 0
    for (let i = 0; i < actual.length; i++) {
      if (actual[i] !== 0) {
        mapeSum += Math.abs((actual[i] - predicted[i]) / actual[i])
        validPoints++
      }
    }
    const mape = validPoints > 0 ? (mapeSum / validPoints) * 100 : 0

    // RMSE
    const mseSum = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0)
    const rmse = Math.sqrt(mseSum / actual.length)

    return { mape, rmse }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { idProduto, diasPrevisao = 9 } = await req.json()
    
    if (!idProduto) {
      throw new Error('ID do produto é obrigatório')
    }

    console.log(`Gerando previsão para produto ${idProduto}`)

    // Buscar dados de vendas do produto
    const { data: vendas, error: vendasError } = await supabase
      .from('vendas')
      .select('*')
      .eq('id_produto', idProduto)
      .order('data_dia', { ascending: true })

    if (vendasError) throw vendasError
    
    if (!vendas || vendas.length < 14) {
      throw new Error('Dados insuficientes para gerar previsão (mínimo 14 dias)')
    }

    // Preparar dados para o modelo
    const serieVendas = vendas.map(v => v.total_venda_dia_kg)
    const testeDays = 7
    const treinoData = serieVendas.slice(0, -testeDays)
    const testeData = serieVendas.slice(-testeDays)

    // Criar e treinar modelo
    const modelo = new SimpleTimeSeriesModel(treinoData)
    
    // Gerar previsões para teste + dias futuros
    const previsaoCompleta = modelo.forecast(testeDays + diasPrevisao - testeDays)
    
    // Calcular métricas no período de teste
    const previsaoTeste = previsaoCompleta.mean.slice(0, testeDays)
    const metricas = modelo.calculateMetrics(testeData, previsaoTeste)

    // Preparar dados para inserção
    const dataHoje = new Date()
    const previsoesParaInserir = []
    
    for (let i = 0; i < diasPrevisao; i++) {
      const dataPrevisao = new Date(dataHoje)
      dataPrevisao.setDate(dataHoje.getDate() + i + 1)
      
      previsoesParaInserir.push({
        id_produto: idProduto,
        data_previsao: dataPrevisao.toISOString().split('T')[0],
        demanda_prevista: previsaoCompleta.mean[testeDays + i] || 0,
        intervalo_confianca_inferior: previsaoCompleta.lower[testeDays + i] || 0,
        intervalo_confianca_superior: previsaoCompleta.upper[testeDays + i] || 0,
        mape: metricas.mape,
        rmse: metricas.rmse
      })
    }

    // Limpar previsões antigas e inserir novas
    await supabase
      .from('previsoes')
      .delete()
      .eq('id_produto', idProduto)

    const { data: novasPrevisoes, error: previsaoError } = await supabase
      .from('previsoes')
      .insert(previsoesParaInserir)
      .select()

    if (previsaoError) throw previsaoError

    // Calcular dados de controle de estoque
    const perdaPeso = 0.15
    const ultimaVenda = serieVendas[serieVendas.length - 1] || 0
    
    const demandaD1 = previsoesParaInserir[0]?.demanda_prevista || 0
    const demandaD2 = previsoesParaInserir[1]?.demanda_prevista || 0
    
    const qtdRetirarHoje = demandaD2 / (1 - perdaPeso)
    const qtdEmDescongelamento = demandaD1 / (1 - perdaPeso)
    const qtdDisponivelHoje = ultimaVenda / (1 - perdaPeso)

    // Inserir dados de controle de estoque
    const controleEstoque = {
      id_produto: idProduto,
      data_referencia: dataHoje.toISOString().split('T')[0],
      qtd_retirar_hoje: qtdRetirarHoje,
      qtd_em_descongelamento: qtdEmDescongelamento,
      qtd_disponivel_hoje: qtdDisponivelHoje,
      perda_peso: perdaPeso
    }

    await supabase
      .from('controle_estoque')
      .upsert(controleEstoque, { onConflict: 'id_produto,data_referencia' })

    console.log(`Previsão gerada com sucesso. MAPE: ${metricas.mape.toFixed(2)}%, RMSE: ${metricas.rmse.toFixed(2)}`)

    return new Response(
      JSON.stringify({
        message: 'Previsão gerada com sucesso',
        previsoes: novasPrevisoes,
        controleEstoque,
        metricas: {
          mape: `${metricas.mape.toFixed(2)}%`,
          rmse: metricas.rmse.toFixed(2)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro ao gerar previsão:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
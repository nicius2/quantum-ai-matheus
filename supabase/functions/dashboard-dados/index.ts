import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const url = new URL(req.url)
    const idProduto = url.searchParams.get('idProduto')
    
    if (!idProduto) {
      throw new Error('ID do produto é obrigatório')
    }

    console.log(`Buscando dados do dashboard para produto ${idProduto}`)

    // Buscar controle de estoque atual
    const { data: controleEstoque, error: controleError } = await supabase
      .from('controle_estoque')
      .select('*')
      .eq('id_produto', idProduto)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (controleError && controleError.code !== 'PGRST116') {
      throw controleError
    }

    // Buscar previsões recentes
    const { data: previsoes, error: previsoesError } = await supabase
      .from('previsoes')
      .select('*')
      .eq('id_produto', idProduto)
      .gte('data_previsao', new Date().toISOString().split('T')[0])
      .order('data_previsao', { ascending: true })
      .limit(10)

    if (previsoesError) throw previsoesError

    // Buscar dados de vendas recentes (últimos 30 dias)
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() - 30)
    
    const { data: vendas, error: vendasError } = await supabase
      .from('vendas')
      .select('*')
      .eq('id_produto', idProduto)
      .gte('data_dia', dataLimite.toISOString().split('T')[0])
      .order('data_dia', { ascending: true })

    if (vendasError) throw vendasError

    // Calcular estatísticas semanais
    const vendasUltimaSemana = vendas?.slice(-7) || []
    const totalSemana = vendasUltimaSemana.reduce((sum, v) => sum + v.total_venda_dia_kg, 0)
    const mediaDiaria = vendasUltimaSemana.length > 0 ? totalSemana / vendasUltimaSemana.length : 0
    
    // Calcular eficiência (simulada - em produção seria baseada em metas reais)
    const metaDiaria = mediaDiaria * 1.1 // Meta 10% acima da média
    const eficiencia = metaDiaria > 0 ? Math.min((mediaDiaria / metaDiaria) * 100, 100) : 0

    // Preparar dados para o dashboard
    const dashboardData = {
      produto: {
        id: parseInt(idProduto),
        vendas: vendas || []
      },
      metricas: {
        retiradaHoje: controleEstoque?.qtd_retirar_hoje || 0,
        descongelamento: controleEstoque?.qtd_em_descongelamento || 0,
        disponivelHoje: controleEstoque?.qtd_disponivel_hoje || 0,
        perdaPeso: controleEstoque?.perda_peso || 0.15
      },
      estatisticas: {
        totalSemana: totalSemana.toFixed(1),
        mediaDiaria: mediaDiaria.toFixed(1),
        eficiencia: eficiencia.toFixed(1)
      },
      previsoes: previsoes || [],
      controleEstoque: controleEstoque,
      cronograma: [
        {
          day: 1,
          stage: "Retirada",
          amount: controleEstoque?.qtd_retirar_hoje || 0,
          status: "current"
        },
        {
          day: 2,
          stage: "Retirada", 
          amount: previsoes?.[1]?.demanda_prevista / (1 - (controleEstoque?.perda_peso || 0.15)) || 0,
          status: "pending"
        },
        {
          day: 3,
          stage: "Descongelamento",
          amount: controleEstoque?.qtd_retirar_hoje || 0,
          status: "pending"
        },
        {
          day: 4,
          stage: "Descongelamento",
          amount: previsoes?.[1]?.demanda_prevista / (1 - (controleEstoque?.perda_peso || 0.15)) || 0,
          status: "pending"
        },
        {
          day: 5,
          stage: "Disponível",
          amount: controleEstoque?.qtd_retirar_hoje || 0,
          status: "pending"
        },
        {
          day: 6,
          stage: "Disponível",
          amount: previsoes?.[1]?.demanda_prevista / (1 - (controleEstoque?.perda_peso || 0.15)) || 0,
          status: "pending"
        }
      ],
      metricas_modelo: {
        mape: previsoes?.[0]?.mape ? `${previsoes[0].mape.toFixed(2)}%` : 'N/A',
        rmse: previsoes?.[0]?.rmse ? previsoes[0].rmse.toFixed(2) : 'N/A'
      }
    }

    console.log(`Dados do dashboard preparados para produto ${idProduto}`)

    return new Response(
      JSON.stringify(dashboardData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
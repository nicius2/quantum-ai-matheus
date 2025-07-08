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

    const { csvData } = await req.json()
    
    if (!csvData || !Array.isArray(csvData)) {
      throw new Error('CSV data must be an array of objects')
    }

    // Processar e inserir dados de vendas
    const vendasProcessadas = csvData.map((row: any) => ({
      data_dia: row.data_dia,
      id_produto: parseInt(row.id_produto),
      total_venda_dia_kg: parseFloat(row.total_venda_dia_kg),
      promocao: row.promocao === 'true' || row.promocao === true || row.promocao === 1,
      feriado: row.feriado === 'true' || row.feriado === true || row.feriado === 1
    }))

    // Inserir em lotes para melhor performance
    const batchSize = 100
    const results = []
    
    for (let i = 0; i < vendasProcessadas.length; i += batchSize) {
      const batch = vendasProcessadas.slice(i, i + batchSize)
      const { data, error } = await supabase
        .from('vendas')
        .upsert(batch, { 
          onConflict: 'id_produto,data_dia',
          ignoreDuplicates: false 
        })
      
      if (error) throw error
      results.push(...(data || []))
    }

    console.log(`Processados ${vendasProcessadas.length} registros de vendas`)

    return new Response(
      JSON.stringify({ 
        message: 'Dados de vendas importados com sucesso',
        processedRecords: vendasProcessadas.length,
        insertedRecords: results.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro ao processar upload de vendas:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
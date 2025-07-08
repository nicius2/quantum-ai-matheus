-- Tabela para armazenar dados de vendas
CREATE TABLE public.vendas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    data_dia DATE NOT NULL,
    id_produto INTEGER NOT NULL,
    total_venda_dia_kg DECIMAL(10,2) NOT NULL,
    promocao BOOLEAN DEFAULT false,
    feriado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para armazenar previsões
CREATE TABLE public.previsoes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    id_produto INTEGER NOT NULL,
    data_previsao DATE NOT NULL,
    demanda_prevista DECIMAL(10,2) NOT NULL,
    intervalo_confianca_inferior DECIMAL(10,2),
    intervalo_confianca_superior DECIMAL(10,2),
    mape DECIMAL(5,2),
    rmse DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para controle de estoque e descongelamento
CREATE TABLE public.controle_estoque (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    id_produto INTEGER NOT NULL,
    data_referencia DATE NOT NULL,
    qtd_retirar_hoje DECIMAL(10,2) NOT NULL,
    qtd_em_descongelamento DECIMAL(10,2) NOT NULL,
    qtd_disponivel_hoje DECIMAL(10,2) NOT NULL,
    perda_peso DECIMAL(5,3) DEFAULT 0.15,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX idx_vendas_produto_data ON public.vendas(id_produto, data_dia);
CREATE INDEX idx_previsoes_produto_data ON public.previsoes(id_produto, data_previsao);
CREATE INDEX idx_controle_produto_data ON public.controle_estoque(id_produto, data_referencia);

-- Enable RLS
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.previsoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controle_estoque ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para acesso público (ajuste conforme necessário)
CREATE POLICY "Vendas são acessíveis publicamente" ON public.vendas FOR ALL USING (true);
CREATE POLICY "Previsões são acessíveis publicamente" ON public.previsoes FOR ALL USING (true);
CREATE POLICY "Controle de estoque é acessível publicamente" ON public.controle_estoque FOR ALL USING (true);

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar timestamps
CREATE TRIGGER update_vendas_updated_at
    BEFORE UPDATE ON public.vendas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_controle_estoque_updated_at
    BEFORE UPDATE ON public.controle_estoque
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
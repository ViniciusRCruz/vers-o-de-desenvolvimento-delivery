-- ==========================================
-- SUPABASE SCHEMA SETUP FOR DELIVERY APP
-- ==========================================

-- 1. Tabela de Lojas (Markets)
CREATE TABLE public.markets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    "isActive" BOOLEAN DEFAULT false,
    "isOpen" BOOLEAN DEFAULT false, -- Toggle: Loja aberta ou fechada para receber pedidos
    "adminEmails" TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS (Segurança)
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;

-- Regras:
-- Qualquer usuário logado pode listar os mercados ativos
CREATE POLICY "Qualquer um pode ver mercados ativos" ON public.markets
FOR SELECT USING (auth.role() = 'authenticated' AND "isActive" = true);


-- 2. Tabela de Produtos (Products)
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "marketId" UUID REFERENCES public.markets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    "promotionalPrice" NUMERIC(10,2), -- Promocao custeada pelo lojista
    "platformDiscount" NUMERIC(10,2), -- Desconto subsidiado pelo app (Master Admin)
    category TEXT,
    image TEXT,
    "isActive" BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Qualquer um logado pode ver produtos
CREATE POLICY "Qualquer um pode ver produtos" ON public.products
FOR SELECT USING (auth.role() = 'authenticated');


-- 3. Tabela de Administradores do Sistema (System Admins)
CREATE TABLE public.system_admins (
    email TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.system_admins ENABLE ROW LEVEL SECURITY;
-- Apenas admins podem ler (precisamos de uma função para checar isso)
-- Mas para facilitar, já vamos inserir seu email
INSERT INTO public.system_admins (email) VALUES ('vinissoba@gmail.com') ON CONFLICT DO NOTHING;


-- 4. Tabela de Perfil de Usuários e Endereços (Users Private Info)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    cpf TEXT,
    "activeAddressId" TEXT,
    addresses JSONB DEFAULT '[]'::jsonb, -- Usamos JSONB para guardar o array de endereços igual ao Firebase
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Usuários só podem ler e alterar o próprio perfil
CREATE POLICY "Usuários veem o próprio perfil" ON public.user_profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários alteram o próprio perfil" ON public.user_profiles
FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);


-- 5. Tabela de Pedidos (Orders)
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    "marketId" UUID REFERENCES public.markets(id) ON DELETE RESTRICT NOT NULL,
    "marketName" TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, prep, delivery, finished, canceled
    total NUMERIC(10,2) NOT NULL,
    items JSONB NOT NULL, -- O carrinho
    "deliveryAddress" JSONB,
    "paymentMethod" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Cliente pode ver seus próprios pedidos
CREATE POLICY "Clientes veem próprios pedidos" ON public.orders
FOR SELECT USING (auth.uid() = "userId");

-- Cliente pode criar seus próprios pedidos
CREATE POLICY "Clientes podem criar pedidos" ON public.orders
FOR INSERT WITH CHECK (auth.uid() = "userId");

-- Admin Bypass Function para RLS (Permite que Admins façam qualquer coisa no banco)
-- (Simplificação útil para desenvolvimento rápido)
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.system_admins WHERE email = auth.jwt() ->> 'email'
  ) OR auth.jwt() ->> 'email' = 'vinissoba@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Regras baseadas na função admin global
CREATE POLICY "Admins globais podem tudo em markets" ON public.markets FOR ALL USING (public.is_admin());
-- Admins globais e donos da loja podem gerenciar os pedidos da loja
CREATE POLICY "Donos de loja podem gerenciar pedidos" ON public.orders
FOR ALL USING (
    public.is_admin() OR 
    EXISTS (
        SELECT 1 FROM public.markets m 
        WHERE m.id = "marketId" 
        AND auth.jwt() ->> 'email' = ANY(m."adminEmails")
    )
);

-- Politicas para produtos
-- Admins globais e donos da loja podem gerenciar os produtos da loja
CREATE POLICY "Donos de loja podem gerenciar produtos" ON public.products
FOR ALL USING (
    public.is_admin() OR 
    EXISTS (
        SELECT 1 FROM public.markets m 
        WHERE m.id = "marketId" 
        AND auth.jwt() ->> 'email' = ANY(m."adminEmails")
    )
);


-- 5. Tabela de Avaliações (Reviews)
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "orderId" UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    "marketId" UUID REFERENCES public.markets(id) ON DELETE CASCADE NOT NULL,
    "userId" UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Qualquer logado pode ver avaliações
CREATE POLICY "Qualquer um pode ver avaliações" ON public.reviews
FOR SELECT USING (auth.role() = 'authenticated');

-- Clientes podem criar avaliações dos seus pedidos
CREATE POLICY "Clientes podem criar avaliações" ON public.reviews
FOR INSERT WITH CHECK (auth.uid() = "userId");


-- NOTA: Execute isso na página "SQL Editor" no Dashboard do Supabase!

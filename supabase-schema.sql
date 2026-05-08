-- ============================================
-- קניות הבית - משפחת בן יהודה
-- Supabase Database Schema
-- הרץ SQL זה ב-Supabase SQL Editor
-- ============================================

-- 1. טבלת מיילים מאושרים (רק מי שמייל שלו כאן יכול להתחבר)
CREATE TABLE IF NOT EXISTS public.approved_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. טבלת פריטי קניות
CREATE TABLE IF NOT EXISTS public.shopping_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (
    category IN ('dry_goods', 'meat', 'dairy', 'vegetables_fruits', 'payment_basket')
  ),
  is_checked BOOLEAN DEFAULT FALSE,
  price DECIMAL(10, 2) DEFAULT NULL,
  quantity INTEGER DEFAULT 1,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  added_by_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS idx_shopping_items_category ON public.shopping_items(category);
CREATE INDEX IF NOT EXISTS idx_shopping_items_created_at ON public.shopping_items(created_at);

-- 4. הפעל Row Level Security
ALTER TABLE public.approved_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

-- 5. מדיניות גישה - approved_emails
-- כל משתמש מחובר יכול לקרוא (לצורך בדיקת הרשאות בלוגין)
CREATE POLICY "Anyone can read approved emails" ON public.approved_emails
  FOR SELECT USING (true);

-- רק Service Role יכול לשנות (מנהל מוסיף ידנית)
CREATE POLICY "Service role can manage approved emails" ON public.shopping_items
  FOR ALL USING (true);

-- 6. מדיניות גישה - shopping_items
-- כל משתמש מחובר יכול לקרוא את כל הפריטים
CREATE POLICY "Authenticated users can read items" ON public.shopping_items
  FOR SELECT TO authenticated USING (true);

-- כל משתמש מחובר יכול להוסיף פריטים
CREATE POLICY "Authenticated users can insert items" ON public.shopping_items
  FOR INSERT TO authenticated WITH CHECK (true);

-- כל משתמש מחובר יכול לעדכן פריטים
CREATE POLICY "Authenticated users can update items" ON public.shopping_items
  FOR UPDATE TO authenticated USING (true);

-- כל משתמש מחובר יכול למחוק פריטים
CREATE POLICY "Authenticated users can delete items" ON public.shopping_items
  FOR DELETE TO authenticated USING (true);

-- 7. הפעל Realtime לטבלת הקניות
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_items;

-- ============================================
-- הוסף מיילים מאושרים של בני משפחה:
-- ============================================
-- INSERT INTO public.approved_emails (email) VALUES
--   ('member1@gmail.com'),
--   ('member2@gmail.com'),
--   ('gilbeny@gmail.com');  -- דוגמה

-- ============================================
-- הדרכות לאחר הרצת SQL:
-- 1. בדאשבורד Supabase > Authentication > Email Templates
--    שנה את הגדרת OTP ל-6 ספרות
-- 2. Authentication > Providers > Email
--    ודא ש-"Enable Email OTP" מופעל
-- 3. ב-.env.local מלא את הפרטים מ:
--    Settings > API > URL + anon key
-- ============================================

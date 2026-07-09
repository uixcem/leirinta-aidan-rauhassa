
CREATE POLICY "site-media admin all" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'site-media' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'site-media' AND public.has_role(auth.uid(),'admin'));

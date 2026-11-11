-- Phase 6: Central Product Catalogue Image Storage
-- Bucket: catalogue-images
-- Public read enabled for CDN caching (86400s recommended).
-- Allowed MIME: image/webp only.
-- Max file size: 512 KB (524288 bytes).
-- Write permissions: service_role only. Anonymous and authenticated tenant users are strictly denied.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalogue-images',
  'catalogue-images',
  true,
  524288,
  array['image/webp']::text[]
)
on conflict (id) do update set
  public = true,
  file_size_limit = 524288,
  allowed_mime_types = array['image/webp']::text[];

-- Public read access for objects in the catalogue-images bucket
drop policy if exists "catalogue_images_public_read" on storage.objects;
create policy "catalogue_images_public_read"
  on storage.objects
  for select
  using (bucket_id = 'catalogue-images');

-- Public read access for the catalogue-images bucket record itself
drop policy if exists "catalogue_images_bucket_public_read" on storage.buckets;
create policy "catalogue_images_bucket_public_read"
  on storage.buckets
  for select
  using (id = 'catalogue-images');

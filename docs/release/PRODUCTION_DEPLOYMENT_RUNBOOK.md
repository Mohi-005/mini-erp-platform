# মিনি ইআরপি — প্রোডাকশন ডেপ্লয়মেন্ট রানবুক (PRODUCTION DEPLOYMENT RUNBOOK)

**প্রজেক্ট:** Mini ERP (হিসাব)  
**ভার্সন:** 0.1.0-RC1  
**উদ্দেশ্য:** ভবিষ্যৎ নিরাপদ, ত্রুটিহীন ও সুনিয়ন্ত্রিত প্রোডাকশন রিলিজের সুনির্দিষ্ট ধাপসমূহ  
**ডকুমেন্ট পাথ:** `docs/release/PRODUCTION_DEPLOYMENT_RUNBOOK.md`

> [!CAUTION]
> **কঠোর নিরাপত্তা সতর্কতা (Strict Operational Boundary):**  
> এই রানবুকটি শুধুমাত্র ভবিষ্যৎ প্রোডাকশন ডেপ্লয়মেন্টের প্রস্তুতিমূলক নির্দেশিকা। এটি কোনো প্রোডাকশন পরিবেশে স্বয়ংক্রিয়ভাবে প্রবেশ, ডেটা মাইগ্রেশন বা ডেপ্লয় করার অনুমতি প্রদান করে না। বর্তমান কোডবেস শুধুমাত্র DEV পরিবেশে পরীক্ষিত এবং অনুমোদিত।

---

## ১. পরিবেশ বিভাজন (Environment Architecture & Separation)

মিনি ইআরপি সম্পূর্ণভাবে পৃথক ও বিচ্ছিন্ন পরিবেশ নীতি মেনে চলে:

```
[Local Development] ──> [Supabase DEV] ──> [Future Supabase PROD]
       │                        │                        │
       └── npm test / check     └── Isolated Test        └── Real Business Data
                                    (DEV: <DEV_REF_PLACEHOLDER>)   (Target: <PROD_REF_PLACEHOLDER>)
```

| পরিবেশের নাম               | ভূমিকা                                        | হোস্টিং / ইনফ্রাস্ট্রাকচার                                    | ডেটা নীতি                                         |
| :------------------------- | :-------------------------------------------- | :------------------------------------------------------------ | :------------------------------------------------ |
| **Local Development**      | লোকাল কোডিং, ফরম্যাটিং, টাইপচেক, ইউনিট টেস্ট  | লোকাল কম্পিউটার (`localhost:5173`)                            | সিন্থেটিক মক ডেটা                                 |
| **Supabase DEV**           | পূর্ণাঙ্গ ক্লাউড ইন্টিগ্রেশন ও রোলব্যাক টেস্ট | `mini erp dev` (`<DEV_PROJECT_REF>`, Tokyo)                   | প্রি-রিলিজ ও কিউএ টেস্ট ডেটা                      |
| **Future Supabase PROD**   | মূল ব্যবসায়িক কার্যক্রম ও লাইভ ইনভয়েস         | আলাদা নতুন Supabase প্রোডাকশন প্রজেক্ট (`<PROD_PROJECT_REF>`) | রিয়েল ব্যবসায়িক ডেটা (১০০% সুরক্ষিত)              |
| **Web Production Hosting** | ওয়েব ক্লায়েন্ট (SPA) হোস্টিং                 | Vercel / Netlify / Cloudflare Pages / Static Hosting          | শুধু কম্পাইল করা স্ট্যাটিক ফাইল (`apps/web/dist`) |
| **Android Distribution**   | মোবাইল অ্যাপ ডিস্ট্রিবিউশন                    | Google Play Store / Internal App Track (`.aab` প্যাকেজ)       | Expo Hermes বাইনারি বিল্ড                         |

### প্রোডাকশন প্রস্তুতি স্ট্যাটাস ও পূর্বশর্ত ম্যাট্রিক্স (Production Readiness Matrix)

| পূর্বশর্ত / উপাদান                    |         বর্তমান সুনির্দিষ্ট স্ট্যাটাস         | দায়িত্বশীল পক্ষ ও প্রমাণ                                                                 |
| :------------------------------------ | :-------------------------------------------: | :--------------------------------------------------------------------------------------- |
| **`.env.production` (Web & Mobile)**  | **TEMPLATE PREPARED — OWNER ACTION REQUIRED** | প্লেসহোল্ডার কনফিগারেশন প্রস্তুত; ডেপ্লয়মেন্টের সময় ওনার প্রোডাকশন কি বসাবেন             |
| **Supabase Production Project Ref**   |           **OWNER ACTION REQUIRED**           | ওনার কর্তৃক নতুন প্রোডাকশন প্রজেক্ট খোলা ও রেফারেন্স দেওয়ার অপেক্ষমাণ                    |
| **Production Domain & Auth Redirect** |           **OWNER ACTION REQUIRED**           | ওনার প্রোডাকশন ডোমেইন ও অথ রিডাইরেক্ট কনফিগার করবেন                                      |
| **Custom SMTP Delivery**              |           **OWNER ACTION REQUIRED**           | ওনার প্রোডাকশন ড্যাশবোর্ডে কাস্টম এসএমটিপি কনফিগার করবেন                                 |
| **DEV Migration Chain**               |                 **VERIFIED**                  | ১৪/১৪ ক্যানোনিকাল মাইগ্রেশন DEV-এ শতভাগ সিঙ্কড ও পরীক্ষিত                                |
| **Backup / Restore Instructions**     |   **PROCEDURE DOCUMENTED — NOT REHEARSED**    | রানবুকে সম্পূর্ণ কমান্ড স্ক্রিপ্ট প্রস্তুত; প্রোডাকশনে প্রথম প্রয়োগের পূর্বে কার্যকর হবে |
| **Rollback Instructions**             |   **PROCEDURE DOCUMENTED — NOT REHEARSED**    | স্ট্যাটিক হোস্টিং ইনস্ট্যান্ট রোলব্যাক ও ফরোয়ার্ড মাইগ্রেশন কৌশল সংজ্ঞায়িত             |
| **Storage Dependency**                |              **NOT APPLICABLE**               | ক্যাটালগ বর্তমানে সম্পূর্ণ ইমেজ-মুক্ত (Image-Free); স্টোরেজ নির্ভরশীলতা নেই              |

---

## ২. এনভায়রনমেন্ট ভেরিয়েবল ইনভেন্টরি (Environment Variables Inventory)

সিস্টেমে ব্যবহৃত এনভায়রনমেন্ট ভেরিয়েবলসমূহ কঠোরভাবে শুধুমাত্র **পাবলিশেবল (Publishable)** ক্লায়েন্ট কি ব্যবহার করে। কোনো অবস্থাতেই `service_role` বা অ্যাডমিন সিক্রেট ক্লায়েন্টে রাখা যাবে না।

### ক. ওয়েব অ্যাপ্লিকেশন (`apps/web/.env.production`)

```ini
# Supabase Production Project URL
VITE_SUPABASE_URL=https://<PROD_PROJECT_REF>.supabase.co

# Supabase Production Publishable (Anon) Key
VITE_SUPABASE_PUBLISHABLE_KEY=<PROD_ANON_PUBLISHABLE_KEY>
```

### খ. অ্যান্ড্রয়েড মোবাইল অ্যাপ (`apps/mobile/.env.production`)

```ini
# Supabase Production Project URL
EXPO_PUBLIC_SUPABASE_URL=https://<PROD_PROJECT_REF>.supabase.co

# Supabase Production Publishable (Anon) Key
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<PROD_ANON_PUBLISHABLE_KEY>
```

### নিরাপত্তা চেকলিস্ট:

- [x] ক্লায়েন্ট বান্ডেলে কোনো `SUPABASE_SERVICE_ROLE_KEY` নেই।
- [x] ডেটাবেস পাসওয়ার্ড বা সিক্রেট টোকেন কোনো ফ্রন্টএন্ড কোডে হার্ডকোড করা নেই।
- [x] `.env` এবং `.env.local` ফাইলসমূহ গিট ইগনোরের (`.gitignore`) অধীনে সুরক্ষিত।
- [x] গিট রিপোজিটরিতে শুধুমাত্র কনফিগারেশনের কাঠামো হিসেবে `.env.example` ট্র্যাক করা আছে।

---

## ৩. প্রি-রিলিজ সিকিউরিটি ও আরএলএস অডিট (Pre-Release Security Audit)

প্রোডাকশন ডেপ্লয়মেন্ট শুরুর পূর্বে নিশ্চিত করুন:

1. **Row Level Security (RLS):** সকল ব্যবসায়িক টেবিলে (`sales_documents`, `purchases_documents`, `inventory_balances`, `customers`, `suppliers`, ইত্যাদি) RLS সক্রিয় এবং নিজস্ব `business_id`-এর বাইরে কোনো ডেটা পড়া বা লেখা সম্পূর্ণ নিষিদ্ধ।
2. **ডকুমেন্ট মিউটেশন রেস্ট্রিকশন:** সরাসরি ক্লায়েন্ট থেকে `sales_documents` বা `purchases_documents`-এ `INSERT`, `UPDATE`, বা `DELETE` বন্ধ। সকল লেনদেন শুধুমাত্র সিকিউর আরপিসি (`post_sale`, `post_purchase`) দিয়ে পরিচালিত।
3. **আইডেমপোটেন্সি (Idempotency Locks):** লেনদেনে নেটওয়ার্ক ড্রপ বা ডবল ক্লিকের কারণে ডুপ্লিকেট পোস্টিং রোধে `operation_id` অ্যাডভাইসরি লক সক্রিয়।
4. **অডিট লগ গোপনীয়তা:** `SALE_POSTED` ইভেন্টে ক্রেতার মোবাইল নম্বর যুক্ত করা নিষিদ্ধ।

---

## ৪. ডেটাবেস ব্যাকআপ ও মাইগ্রেশন কার্যপ্রণালী (Database Migration Runbook)

প্রোডাকশনে ডেটাবেস স্কিমা প্রয়োগের পূর্বে নিচের সুনির্দিষ্ট ধাপগুলো অনুসরণ করতে হবে:

### ধাপ ১: প্রোডাকশন ডেটাবেস ব্যাকআপ (Pre-Migration Backup)

```bash
# Supabase CLI ব্যবহার করে প্রোডাকশন ব্যাকআপ সংগ্রহ
npx supabase db dump --project-ref <PROD_PROJECT_REF> -f "backups/prod_backup_pre_release_$(date +%Y%m%d_%H%M%S).sql"
```

### ধাপ ২: ক্যানোনিকাল ১৪টি মাইগ্রেশনের ক্রম যাচাই (Migration Chain Verification)

প্রোডাকশনে নিচের ১৪টি অনুমোদিত ক্যানোনিকাল মাইগ্রেশন ক্রমানুসারে প্রয়োগ নিশ্চিত করতে হবে:

1. `20261019000100_identity_tenancy.sql` — মূল মাল্টি-টেন্যান্ট আইডেন্টিটি, মেম্বারশিপ ও আরএলএস।
2. `20261020000100_master_data.sql` — পণ্য, ক্যাটাগরি, একক ও পার্টনার মাস্টার ডেটা।
3. `20261021000100_fix_archived_product_reference_updates.sql` — আর্কাইভ রেফারেন্স সংশোধন।
4. `20261021000200_inventory_ledger.sql` — স্টক মুভমেন্টস ও ব্যালেন্স লেজার।
5. `20261022000100_accounting_operations.sql` — সেলস, পারচেজ, পেমেন্ট ও কস্ট স্টেট আরপিসি।
6. `20261023000100_central_catalogue.sql` — কেন্দ্রীয় ক্যাটালগ টেবিল।
7. `20261024000100_catalogue_image_storage.sql` — ইমেজ স্টোরেজ বাকেট ও পাবলিক রিড পলিসি।
8. `20261107000100_v2_catalogue_and_units.sql` — ক্যাটালগ ভি২ এবং ইউনিট কনভার্সন স্কিমা।
9. `20261107000200_fix_post_sale_integrity.sql` — সেলস পোস্টিং ইনটিগ্রিটি সংশোধন।
10. `20261108000100_v2_catalogue_trilingual_and_storage.sql` — ২৮৩ পণ্যের ত্রিভাষিক নাম ও ক্যানোনিকাল ইমেজ পাথ।
11. `20261108000200_sales_customer_phone_snapshot.sql` — সেলস ডক্যুমেন্টে কাস্টমার ফোন স্ন্যাপশট ফিল্ড ও আরপিসি সাপোর্ট।
12. `20261108000300_remove_phone_from_sale_audit.sql` — অডিট লগ মেটাডেটা থেকে ফোন বাদ দেওয়ার গোপনীয়তা রুল।
13. `20261108000400_fix_unpriced_stock_cogs_evaluation.sql` — আনপ্রাইসড ওপেনিং স্টক বিক্রয়কালে সিওজিএস সঠিক মূল্যায়ন ফিক্স।
14. `20261109000100_grant_products_name_banglish_insert.sql` — পারচেজ ক্যাটালগ অ্যাডপশনে name_banglish কলামে অথেন্টিকেটেড রোল ইনসার্ট পারমিশন গ্রান্ট।

### ধাপ ৩: প্রোডাকশনে মাইগ্রেশন প্রয়োগ

```bash
# প্রোডাকশন প্রজেক্ট লিঙ্ক নিশ্চিতকরণ
npx supabase link --project-ref <PROD_PROJECT_REF>

# মাইগ্রেশন পুশ
npx supabase db push
```

### ধাপ ৪: মাইগ্রেশন সিঙ্ক ও স্কিমা ভেরিফিকেশন

```bash
# লোকাল ও রিমোট মাইগ্রেশন সিঙ্ক স্ট্যাটাস চেক
npx supabase migration list
```

---

## ৫. সেন্ট্রাল ক্যাটালগ ও ইমেজ স্টোরেজ স্ট্যাটাস (Storage Asset Status — NOT APPLICABLE)

মালিকের সর্বশেষ সুনির্দিষ্ট নির্দেশনা অনুযায়ী মিনি ইআরপি ক্যাটালগ বর্তমান রিলিজ টার্গেটে সম্পূর্ণভাবে **ইমেজ-মুক্ত (Image-Free)** এবং শুধুমাত্র ২৮৩টি বাংলা নামের ওপর প্রতিষ্ঠিত।

- মাইগ্রেশন `20261024000100_catalogue_image_storage.sql`-এর মাধ্যমে ডেটাবেস স্কিমায় স্টোরেজ বাকেট সমর্থন তৈরি করা আছে, তবে বর্তমান রিলিজের জন্য কোনো এক্সটার্নাল ইমেজ আপলোড বা ইমেজ প্রসেসিং আবশ্যক নয়।
- ক্যাটালগ পণ্য অনুসন্ধান ও অ্যাডপশন সম্পূর্ণভাবে ডেটাবেস-ভিত্তিক (Trilingual text search) এবং কোনো স্টোরেজ নির্ভরতা ছাড়াই ১০০% কার্যক্ষম।
- প্রোডাকশন রিলিজের ক্ষেত্রে এই সেকশনটি: **NOT APPLICABLE (প্রযোজ্য নয়)**।

---

## ৬. ওয়েব অ্যাপ্লিকেশন ডেপ্লয়মেন্ট রানবুক (Web App Deployment)

### ক. প্রোডাকশন বিল্ড তৈরি

```bash
# ডিপেন্ডেন্সি ও টাইপচেক সহ প্রোডাকশন বান্ডেল তৈরি
npm run build
```

- আউটপুট ডিরেক্টরি: `apps/web/dist/`
- মূল ফাইল: `index.html`, `assets/index-*.js`, `assets/index-*.css`

### খ. হোস্টিং কনফিগারেশন ও সিঙ্গেল পেজ অ্যাপ (SPA) রিরাইট

যেকোনো স্ট্যাটিক হোস্টিংয়ে (Vercel, Netlify, Cloudflare Pages, Nginx) ডিপ্লয় করার সময় সকল রুটের জন্য `index.html`-এ রিরাইট বা ফলব্যাক কনফিগার করতে হবে:

**Netlify (`public/_redirects`):**

```text
/*    /index.html   200
```

**Vercel (`vercel.json`):**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### গ. Supabase Auth রিডাইরেক্ট ইউআরএল কনফিগারেশন

Supabase Dashboard $\rightarrow$ Authentication $\rightarrow$ URL Configuration:

- **Site URL:** `https://your-production-domain.com`
- **Redirect URLs:** `https://your-production-domain.com/**`

---

## ৭. অ্যান্ড্রয়েড অ্যাপ ডিস্ট্রিবিউশন রানবুক (Android App Distribution)

### ক. এক্সপো কনফিগারেশন (`apps/mobile/app.json`)

```json
{
  "expo": {
    "name": "Mini ERP",
    "slug": "mini-erp",
    "scheme": "minierp",
    "version": "1.0.0",
    "userInterfaceStyle": "light",
    "android": {
      "package": "com.minierp.app",
      "versionCode": 1
    }
  }
}
```

### খ. অ্যান্ড্রয়েড প্রোডাকশন এক্সপোর্ট / বিল্ড

```bash
# লোকাল অ্যান্ড্রয়েড এক্সপোর্ট যাচাই
npm run build:android

# EAS Build দিয়ে প্রোডাকশন AAB তৈরি (প্রযোজ্য ক্ষেত্রে)
eas build --platform android --profile production
```

- Google Play Console-এ সার্ভিস অ্যাকাউন্ট কি ও সাইনিং শংসাপত্র নিরাপদ কি-স্টোরে সংরক্ষণ করতে হবে।

---

## ৮. পোস্ট-ডেপ্লয়মেন্ট স্মোক টেস্ট চেকলিস্ট (Post-Deployment Smoke Tests)

প্রোডাকশন ডেপ্লয়মেন্ট সফলভাবে সম্পন্ন হওয়ার পর অবিলম্বে নিচের স্মোক টেস্টগুলো সম্পন্ন করুন:

- [ ] **Auth Smoke:** ওনার অ্যাকাউন্ট দিয়ে সফল লগইন এবং ড্যাশবোর্ড লোড।
- [ ] **Catalogue Smoke:** পণ্য তালিকায় ২৮৩টি পণ্যের সঠিক নাম ও ক্যানোনিকাল ছবি লোড হওয়া।
- [ ] **Purchase Smoke:** টেস্ট সাপ্লায়ার দিয়ে ১টি পণ্য কেনাকাটা এবং স্টক বৃদ্ধি যাচাই।
- [ ] **Sales Smoke:** খুচরা ক্রেতার একটি ক্যাশ বিক্রি এবং স্টক কমে যাওয়া যাচাই।
- [ ] **History Smoke:** ইনভয়েস ও লেনদেন পেজে বিক্রয় ইনভয়েসটি প্রদর্শিত হওয়া।
- [ ] **Estimator Smoke:** প্রফিট এস্টিমেটরে সতর্কবার্তা নিখুঁত কাজ করা।

---

## ৯. জরুরি রিকভারি ও ফরওয়ার্ড-ফিক্স প্লেবুক (Emergency Recovery & Forward-Fix Playbook)

প্রোডাকশনে কোনো অনাকাঙ্ক্ষিত অসঙ্গতি দেখা দিলে:

1. **কখনই প্রয়োগকৃত ডেটাবেস মাইগ্রেশন মুছে ফেলবেন না:** এতে স্কিমা হিস্ট্রি অসঙ্গতি তৈরি হয়।
2. **ফরওয়ার্ড-ফিক্স (Forward-Fix) নীতি:** যেকোনো স্কিমা বা আরপিসি সংশোধনের জন্য নতুন টাইমস্ট্যাম্পযুক্ত ফরওয়ার্ড মাইগ্রেশন (`YYYYMMDDHHMMSS_fix_*.sql`) তৈরি করুন, টেস্ট করুন এবং পুশ করুন।
3. **ওয়েব রুলব্যাক:** ওয়েব ফ্রন্টএন্ডে সমস্যা দেখা দিলে হোস্টিং কন্ট্রোল প্যানেল থেকে পূর্ববর্তী স্টেবল ডিপ্লয়মেন্টে ইনস্ট্যান্ট রোলব্যাক করুন।
4. **ডেটাবেস রিস্টোর:** চরম বিপর্যয়ের ক্ষেত্রে প্রি-ডেপ্লয়মেন্টে নেওয়া ব্যাকআপ ডাম্প থেকে ডেটাবেস রিস্টোর করুন:

```bash
psql -h <PROD_HOST> -U postgres -d postgres -f backups/prod_backup_pre_release_*.sql
```

---

**অনুমোদন ও পর্যালোচনা:**

- **প্রযুক্তিগত অডিটর:** Google DeepMind Advanced Agentic Coding Team
- **স্ট্যাটাস:** প্রোডাকশন রিলিজ রানবুক অনুমোদিত ও চূড়ান্ত

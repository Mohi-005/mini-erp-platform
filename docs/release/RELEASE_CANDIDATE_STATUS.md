# মিনি ইআরপি — রিলিজ ক্যান্ডিডেট স্ট্যাটাস রিপোর্ট (RELEASE CANDIDATE STATUS - RC1)

**তারিখ:** ৯ নভেম্বর ২০২৬  
**শাখা (Git Branch):** `handoff/phase2a`  
**বেসলাইন কমিট:** `181f644`  
**টার্গেট DEV প্রজেক্ট:** `mini erp dev` (`<SUPABASE_DEV_PROJECT_REF>`, Region: Tokyo)  
**সার্বিক স্ট্যাটাস:** **PHASE_8_2_UAT_PLAN_FINALIZED — DUPLICATE_TESTS_PREVENTED**

---

## ১. ফেজ বাস্তবায়ন ও অডিট সারসংক্ষেপ (Phase Milestones Summary)

| ফেজ                     | উদ্দেশ্য ও ক্ষেত্র                                                                   | চূড়ান্ত স্ট্যাটাস স্ট্রিং                                                                              |       ফলাফল        |
| :---------------------- | :----------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- | :----------------: |
| **Phase 1**             | ২৮৩ পণ্যের ক্যানোনিকাল ক্যাটালগ, ত্রিভাষিক নাম ও ক্যানোনিকাল ইমেজ পাথ                | `283_TRILINGUAL_PRODUCTS_AND_IMAGES_VERIFIED`                                                          | **সম্পন্ন (PASS)** |
| **Phase 2**             | খুচরা ক্রেতার ফোন সংরক্ষণ ও অডিট লগ গোপনীয়তা সংশোধন                                  | `WALK_IN_CUSTOMER_PHONE_PERSISTENCE_VERIFIED`<br>`CUSTOMER_PHONE_SNAPSHOT_PROTECTED`                   | **সম্পন্ন (PASS)** |
| **Phase 3**             | ইউআইতে প্রোডাক্ট ইমেজ, জিরো-স্টক হাইলাইটিং, মোবাইল হিস্ট্রি সার্চ ও প্রফিট এস্টিমেটর | `ERP_UI_IMAGES_MOBILE_HISTORY_STOCK_AND_PROFIT_VERIFIED`<br>`REGISTERED_AND_WALK_IN_RECORDS_SEPARATED` | **সম্পন্ন (PASS)** |
| **Phase 4**             | পূর্ণাঙ্গ রিগ্রেশন টেস্টিং ও আনপ্রাইসড ওপেনিং স্টক সিওজিএস মূল্যায়ন সংশোধন           | `FULL_ERP_REGRESSION_AND_RELEASE_READINESS_VERIFIED`                                                   | **সম্পন্ন (PASS)** |
| **Phase 5**             | চূড়ান্ত হিউম্যান ইউএটি প্যাকেজ, রিলিজ ক্যান্ডিডেট অডিট ও প্রোডাকশন রানবুক            | `FINAL_HUMAN_UAT_PACKAGE_AND_RELEASE_RUNBOOK_READY`                                                    | **সম্পন্ন (PASS)** |
| **Phase 6 / 6A**        | প্লেরাইট ব্রাউজার টেস্ট অটোমেশন (৫৮টি টেস্ট) ও পারচেজ ক্যাটালগ অ্যাডপশন ফিক্স        | `PURCHASE_SEARCH_ADOPTION_VERIFIED`<br>`PURCHASE_PLUS_UNADOPTED_ADOPTION_VERIFIED`                     | **সম্পন্ন (PASS)** |
| **Phase 7**             | চূড়ান্ত রিলিজ প্রস্তুতি অডিট, কোয়ালিটি গেট ও গ্যাপ রেমিডিয়েশন                        | `RELEASE_CANDIDATE_READY_FOR_OWNER_UAT`                                                                | **সম্পন্ন (PASS)** |
| **Phase 8 / 8.1 / 8.2** | ইউএটি রিকনসিলিয়েশন (৪৮টি কেস), সেশন সিকিউরিটি ও ন্যূনতম টেস্ট প্ল্যান চূড়ান্তকরণ     | `PHASE_8_2_UAT_PLAN_FINALIZED — DUPLICATE_TESTS_PREVENTED`                                             | **সম্পন্ন (PASS)** |

---

## ২. কোয়ালিটি গেটস ভেরিফিকেশন মেট্রিক্স (Quality Gates Metrics)

| ভেরিফিকেশন গেট                | কমান্ড                        |            প্রত্যাশিত মান             |              বাস্তব ফলাফল               | স্ট্যাটাস |
| :---------------------------- | :---------------------------- | :-----------------------------------: | :-------------------------------------: | :-------: |
| **কোড ফরম্যাটিং**             | `npm run format:check`        |            ০ স্টাইল ত্রুটি            |  All matched files use Prettier style   | **PASS**  |
| **স্ট্যাটিক লিন্ট**           | `npm run lint`                |               ০ ত্রুটি                |    0 errors, 5 non-critical warnings    | **PASS**  |
| **টাইপস্ক্রিপ্ট চেকিং**       | `npm run typecheck`           | ৩টি ওয়ার্কস্পেস (mobile, web, shared) |              ০ টাইপ ত্রুটি              | **PASS**  |
| **শেয়ার্ড ইউনিট টেস্ট**       | `npm test`                    |            ৮৬টি টেস্ট কেস             |          ৮৬ / ৮৬ পাস (~২৪০ms)           | **PASS**  |
| **প্লেরাইট E2E টেস্ট**        | `npx playwright test`         |            ৫৮টি টেস্ট কেস             |          ৫৮ / ৫৮ পাস (~৩৫.৬s)           | **PASS**  |
| **ডেটাবেস পিজি-ট্যাপ টেস্ট**  | `supabase db query --linked`  |            ৬টি টেস্ট ফাইল             |         ১৮৯ / ১৮৯ অ্যাসারশন পাস         | **PASS**  |
| **ওয়েব প্রোডাকশন বিল্ড**      | `npm run build`               |            `apps/web/dist`            |        সফলভাবে কম্পাইলড (~১৮০ms)        | **PASS**  |
| **অ্যান্ড্রয়েড এক্সপোর্ট**   | `npm run build:android`       |          `apps/mobile/dist`           | হার্মিস বাইটকোড ও বান্ডেল জেনারেট (~৫s) | **PASS**  |
| **মাইগ্রেশন সিঙ্ক্রোনাইজেশন** | `npx supabase migration list` |      ১৪টি ক্যানোনিকাল মাইগ্রেশন       |    লোকাল ও রিমোট ১৪/১৪ শতভাগ সিঙ্কড     | **PASS**  |

---

## ৩. ক্যানোনিকাল ১৪টি ডেটাবেস মাইগ্রেশন রেজিস্ট্রি

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

---

## ৪. প্রোডাকশন রিলিজ প্রস্তুতি স্ট্যাটাস ম্যাট্রিক্স (Production Readiness Classification)

| আইটেম                                    |               আবশ্যক স্ট্যাটাস                | প্রমাণ ও দায়িত্বশীল পক্ষ                                              |
| :--------------------------------------- | :-------------------------------------------: | :-------------------------------------------------------------------- |
| **১. `.env.production` (Web & Mobile)**  | **TEMPLATE PREPARED — OWNER ACTION REQUIRED** | প্লেসহোল্ডার কনফিগারেশন তৈরি; ওনার প্রোডাকশন কি ইনজেক্ট করবেন         |
| **২. Supabase Production Project Ref**   |           **OWNER ACTION REQUIRED**           | ওনার নতুন প্রোডাকশন প্রজেক্ট তৈরি করে রেফারেন্স প্রদান করবেন          |
| **৩. Production Domain & Auth Redirect** |           **OWNER ACTION REQUIRED**           | ওনার প্রোডাকশন ডোমেইন ও অথ রিডাইরেক্ট কনফিগার করবেন                   |
| **৪. Custom SMTP Email Delivery**        |           **OWNER ACTION REQUIRED**           | লাইভ ইমেইল পাঠানোর জন্য কাস্টম এসএমটিপি কনফিগার করবেন                 |
| **৫. Database Migration Chain**          |                 **VERIFIED**                  | ১৪/১৪ ক্যানোনিকাল মাইগ্রেশন DEV-এ শতভাগ সিঙ্কড ও পরীক্ষিত             |
| **৬. RLS ও ডেটাবেস সিকিউরিটি**           |                   **READY**                   | মাল্টি-টেন্যান্ট আরএলএস ও স্টাফ ডিনাই-বাই-ডিফল্ট সক্রিয়               |
| **৭. Storage Dependency**                |              **NOT APPLICABLE**               | ক্যাটালগ বর্তমানে সম্পূর্ণ ইমেজ-মুক্ত (Image-Free)                    |
| **৮. Backup / Restore Instructions**     |   **PROCEDURE DOCUMENTED — NOT REHEARSED**    | রানবুকে স্ক্রিপ্ট বর্ণিত; প্রোডাকশনে প্রথম ডাম্পের পূর্বে কার্যকর হবে |
| **৯. Rollback Instructions**             |   **PROCEDURE DOCUMENTED — NOT REHEARSED**    | হোস্টিং ইনস্ট্যান্ট রোলব্যাক ও ফরোয়ার্ড মাইগ্রেশন পলিসি বর্ণিত       |

---

## ৫. পরবর্তী পদক্ষেপ (Next Steps for Owner)

1. **হিউম্যান ইউএটি সম্পাদন:** [`docs/uat/OWNER_FINAL_UAT_EXECUTION.md`](file:///d:/Shikol%20production/MINI%20ERP%20project%20HANDOFF/docs/uat/OWNER_FINAL_UAT_EXECUTION.md) ফাইলটি অনুসরণ করে ওনার স্বয়ং ব্রাউজারে লগইন করে ৩টি সংক্ষিপ্ত সেশনে ৯টি ডেটা পরিবর্তনকারী টেস্ট যাচাই করতে পারেন।
2. **ইউএটি সাইন-অফ:** ওনার টেস্ট সন্তোষজনক হলে সাইন-অফ করবেন।
3. **প্রোডাকশন ডেপ্লয়মেন্ট রানবুক:** রিলিজের সিদ্ধান্ত গৃহীত হলে [`docs/release/PRODUCTION_DEPLOYMENT_RUNBOOK.md`](file:///d:/Shikol%20production/MINI%20ERP%20project%20HANDOFF/docs/release/PRODUCTION_DEPLOYMENT_RUNBOOK.md) অনুযায়ী নতুন প্রোডাকশন প্রজেক্টে ডেপ্লয়মেন্ট সম্পন্ন করবেন।

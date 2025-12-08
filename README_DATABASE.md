# Database Setup Guide

## File Database yang Digunakan

### 1. `database.sql` (FILE UTAMA)
File ini adalah **file utama** untuk setup database lengkap dari awal.
- Berisi semua table, index, view, trigger, dan data default
- Sudah termasuk field `location` di table `users`
- Tidak ada foreign key constraint yang bermasalah
- Gunakan file ini untuk **initial setup** database baru

**Cara menggunakan:**
```bash
mysql -u root -p < database.sql
```

### 2. `migrations/20251209000000_add_location_to_users.sql` (MIGRATION)
File ini adalah **migration incremental** untuk update database yang sudah ada.
- Hanya menambahkan field `location` ke table `users` yang sudah ada
- Menambahkan index dan data default
- Gunakan file ini jika database sudah ada dan hanya perlu update

**Cara menggunakan:**
```bash
mysql -u root -p smbe_db < migrations/20251209000000_add_location_to_users.sql
```

## Struktur Folder

```
SMBE/
├── database.sql                    ← FILE UTAMA (gunakan ini untuk setup baru)
├── migrations/                     ← Folder untuk migration files
│   └── 20251209000000_add_location_to_users.sql
└── supabase/                       ← FOLDER INI TIDAK TERPAKAI (bisa dihapus)
    └── migrations/                 ← FOLDER DUPLIKASI (tidak digunakan)
```

## Urutan Setup Database

### Untuk Database Baru (Fresh Install):
1. Jalankan `database.sql` - ini akan membuat semua struktur dari awal

### Untuk Database yang Sudah Ada:
1. Jika database sudah ada tapi belum ada field `location`:
   - Jalankan `migrations/20251209000000_add_location_to_users.sql`

## Catatan Penting

- **Jangan gunakan** folder `supabase/migrations/` - itu duplikasi dan tidak terpakai
- File `database.sql` sudah lengkap dan siap digunakan
- Semua foreign key constraint yang bermasalah sudah dihapus
- Location validation dilakukan di application level (backend)

## Default Users

Setelah setup, user default yang tersedia:

| Email | Password | Role | Location |
|-------|----------|------|----------|
| admin@smbe.com | admin123 | admin | NULL (all locations) |
| inputer@smbe.com | inputer123 | inputer | NULL (all locations) |
| viewer@smbe.com | viewer123 | viewer | NULL (all locations) |
| report_viewer@smbe.com | report123 | report_viewer | NULL (all locations) |
| inputer_a@smbe.com | inputer123 | inputer | Site A - Jakarta |
| inputer_b@smbe.com | inputer123 | inputer | Site B - Bekasi |
| inputer_c@smbe.com | inputer123 | inputer | Site C - Karawang |

**PENTING:** Password disimpan sebagai plain text untuk demo. Di production, gunakan bcrypt hash.


# 📋 DATABASE SETUP - SMBE

## ✅ FILE DATABASE YANG HARUS DIGUNAKAN

### 1. **`database.sql`** - FILE UTAMA (Gunakan ini!)

File ini adalah **file lengkap** untuk setup database dari awal. Sudah termasuk:
- ✅ Semua table (users, roles, equipment, locations, dll)
- ✅ Field `location` di table `users` (tanpa foreign key constraint)
- ✅ Role `report_viewer`
- ✅ Semua index, view, trigger
- ✅ Data default (roles, users, locations)

**Cara menggunakan untuk database baru:**
```bash
mysql -u root -p < database.sql
```

---

### 2. **`migrations/20251209000000_add_location_to_users.sql`** - MIGRATION (Opsional)

File ini hanya digunakan jika database **sudah ada** dan perlu **update** untuk menambahkan:
- Field `location` ke table `users`
- Index untuk location
- Role `report_viewer`
- User contoh baru

**Cara menggunakan (jika database sudah ada):**
```bash
mysql -u root -p smbe_db < migrations/20251209000000_add_location_to_users.sql
```

---

## ❌ FILE YANG TIDAK TERPAKAI (Sudah dihapus)

- ❌ `supabase/migrations/20251208033659_flat_block.sql` - **DIHAPUS**
- ❌ `supabase/migrations/20251209000000_add_location_to_users.sql` - **DIHAPUS**

Folder `supabase/migrations/` sudah kosong dan tidak digunakan.

---

## 📁 STRUKTUR FOLDER YANG BENAR

```
SMBE/
├── database.sql                          ← FILE UTAMA (gunakan ini!)
├── migrations/                           ← Folder migration (opsional)
│   └── 20251209000000_add_location_to_users.sql
└── supabase/                             ← Folder tidak terpakai (kosong)
    └── migrations/                       ← Kosong (bisa dihapus)
```

---

## 🚀 QUICK START

### Untuk Database Baru:
```bash
# 1. Import database utama
mysql -u root -p < database.sql

# 2. Selesai! Database sudah lengkap dengan semua data default
```

### Untuk Database yang Sudah Ada:
```bash
# 1. Jalankan migration untuk update
mysql -u root -p smbe_db < migrations/20251209000000_add_location_to_users.sql

# 2. Selesai! Database sudah di-update
```

---

## 👤 DEFAULT USERS

Setelah setup, user berikut tersedia:

| Email | Password | Role | Location | Keterangan |
|-------|----------|------|----------|------------|
| admin@smbe.com | admin123 | admin | NULL | Akses penuh |
| inputer@smbe.com | inputer123 | inputer | NULL | Akses semua lokasi |
| viewer@smbe.com | viewer123 | viewer | NULL | Hanya lihat |
| report_viewer@smbe.com | report123 | report_viewer | NULL | Hanya lihat daily report |
| inputer_a@smbe.com | inputer123 | inputer | Site A - Jakarta | Hanya lokasi Site A |
| inputer_b@smbe.com | inputer123 | inputer | Site B - Bekasi | Hanya lokasi Site B |
| inputer_c@smbe.com | inputer123 | inputer | Site C - Karawang | Hanya lokasi Site C |

---

## ⚠️ PENTING

1. **Gunakan `database.sql` sebagai file utama** untuk setup baru
2. **Migration file hanya untuk update** database yang sudah ada
3. **Foreign key constraint tidak ada** di `users.location` untuk menghindari error
4. **Password disimpan plain text** untuk demo (production: gunakan bcrypt)
5. **Folder `supabase/migrations/` bisa dihapus** karena tidak terpakai

---

## ✅ CHECKLIST SETUP

- [ ] Database `smbe_db` dibuat
- [ ] File `database.sql` di-import
- [ ] Semua table terbuat
- [ ] Data default (users, roles, locations) ter-insert
- [ ] Backend bisa connect ke database
- [ ] Login dengan user default berhasil

---

**Update terakhir:** 2025-12-09


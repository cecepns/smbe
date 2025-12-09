# Database Changes - December 2025

## Overview
Dokumen ini menjelaskan perubahan struktur database yang diperlukan untuk mendukung fitur-fitur baru dalam sistem SMBE.

## Changes Summary

### 1. Field Baru: `perlu_petty_cash` di tabel `breakdown_data`

**Tujuan:** 
- Menandai apakah breakdown memerlukan alokasi petty cash
- Muncul hanya untuk kategori Service, PMS, atau Storing
- Membantu tracking financial requirement untuk setiap breakdown

**Detail:**
- **Tipe:** `ENUM('yes', 'no')`
- **Nullable:** `YES` (NULL by default)
- **Lokasi:** Setelah field `kategori_perawatan`
- **Index:** `idx_perlu_petty_cash` untuk performa query

## Migration Instructions

### Untuk Database yang Sudah Ada (Existing Database)

Jalankan migration script:

```bash
mysql -u root -p smbe_db < database_migration_add_petty_cash_flag.sql
```

Atau manual via MySQL client:

```sql
USE smbe_db;

-- Add field
ALTER TABLE breakdown_data 
ADD COLUMN perlu_petty_cash ENUM('yes', 'no') NULL DEFAULT NULL AFTER kategori_perawatan;

-- Add index
CREATE INDEX idx_perlu_petty_cash ON breakdown_data(perlu_petty_cash);
```

### Untuk Instalasi Baru

Gunakan file `database.sql` yang sudah diupdate. Field `perlu_petty_cash` sudah termasuk dalam schema.

```bash
mysql -u root -p < database.sql
```

## Verifikasi

Setelah migration, verifikasi dengan query berikut:

```sql
-- Check if field exists
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'smbe_db' 
AND TABLE_NAME = 'breakdown_data' 
AND COLUMN_NAME = 'perlu_petty_cash';

-- Check if index exists
SHOW INDEX FROM breakdown_data WHERE Key_name = 'idx_perlu_petty_cash';
```

**Expected Result:**
```
COLUMN_NAME         DATA_TYPE    IS_NULLABLE    COLUMN_DEFAULT
perlu_petty_cash    enum         YES            NULL
```

## Rollback (Jika Diperlukan)

Jika perlu rollback perubahan:

```sql
USE smbe_db;

-- Remove field
ALTER TABLE breakdown_data DROP COLUMN perlu_petty_cash;

-- Remove index (akan otomatis terhapus saat field dihapus)
-- DROP INDEX idx_perlu_petty_cash ON breakdown_data;
```

## Impact Analysis

### Aplikasi yang Terpengaruh:
1. ✅ **Frontend:** `src/components/BreakdownForm.jsx` - sudah diupdate
2. ✅ **Backend:** `backend/server.js` - sudah support field ini
3. ✅ **Database:** Perlu migration untuk existing database

### Backward Compatibility:
- ✅ **Field nullable:** Tidak akan break existing data
- ✅ **Default NULL:** Tidak perlu update data lama
- ✅ **Optional field:** Form tetap bisa submit tanpa field ini

### Data yang Ada:
- Semua breakdown existing akan memiliki `perlu_petty_cash = NULL`
- Ini normal dan tidak perlu diupdate
- User dapat update manual jika diperlukan

## Testing Checklist

Setelah migration, test:

- [ ] Create breakdown baru dengan kategori Service → field muncul
- [ ] Create breakdown dengan kategori PMS → field muncul
- [ ] Create breakdown dengan kategori Storing → field muncul
- [ ] Pilih "yes" → muncul info box tentang petty cash
- [ ] Pilih "no" → tidak ada error
- [ ] Edit breakdown existing → tidak ada error
- [ ] View breakdown existing → tidak ada error
- [ ] Query reports → performance tetap baik

## Notes

- Migration ini **SAFE** untuk production karena:
  - Field nullable (tidak break existing data)
  - Index ditambahkan untuk performa
  - Backward compatible
  
- Estimasi downtime: **< 1 detik** untuk tabel dengan < 1 juta records

## Support

Jika ada issue setelah migration:
1. Check error logs di MySQL
2. Verifikasi field exists dengan query di atas
3. Rollback jika diperlukan
4. Contact developer untuk assistance

---

**Migration Date:** December 9, 2025  
**Version:** 1.1.0  
**Author:** SMBE Development Team

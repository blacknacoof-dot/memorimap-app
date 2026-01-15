
import pandas as pd
import os
import glob
import re
from datetime import datetime

# ==========================================
# ⚙️ Configuration
# ==========================================
# Assuming script is run from 'scripts/' directory
BACKUP_DIR = os.path.join(os.path.dirname(__file__), '../backups')
# Use absolute path for Korean directory to avoid relative path/glob issues
LOCAL_DIR = r'C:\Users\black\Desktop\memorimap\장례식장'
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '../final_facilities_upload.csv')

# Mappings (Korean -> Enum)
CATEGORY_MAP = {
    'funeral_home': ['장례식장', '병원', '전문', '의료원'],
    'charnel_house': ['봉안', '납골', '추모공원', '추모관', '영묘', '무덤'],
    'natural_burial': ['자연장', '잔디', '화초'],
    'tree_burial': ['수목장', '숲'],
    'pet_memorial': ['동물', '펫', '반려'],
    'sangjo': ['상조', '프리드', '보람'],
    'sea_burial': ['해양', '바다'],
    'park_cemetery': ['공원묘지', '묘지']
}

def create_wkt_point(lat, lng):
    """Creates PostGIS WKT format: POINT(lng lat)"""
    try:
        lat = float(lat)
        lng = float(lng)
        if pd.isna(lat) or pd.isna(lng) or lat == 0 or lng == 0:
            return None
        return f"POINT({lng} {lat})"
    except:
        return None

def determine_category(cat_str, name_str):
    """
    Determines the English enum category based on Korean keywords 
    in the category string or facility name.
    """
    text = (str(cat_str) + " " + str(name_str)).lower()
    
    for enum_key, keywords in CATEGORY_MAP.items():
        for kw in keywords:
            if kw in text:
                return enum_key
    
    return 'complex' # Default if no match

def normalize_phone(phone):
    if pd.isna(phone) or phone == '': return None
    return str(phone).strip()

# ==========================================
# 🚀 ETL Process
# ==========================================

def run_etl():
    print("🚀 Starting Facility Data ETL Process...")
    
    # 1. Load Backup Data (Prioritized)
    # Find latest backup folder
    backup_folders = sorted(glob.glob(os.path.join(BACKUP_DIR, 'backup_*')), reverse=True)
    if not backup_folders:
        print(f"❌ No backup found in '{BACKUP_DIR}'. Aborting.")
        return

    latest_backup_path = os.path.join(backup_folders[0], 'memorial_spaces.csv')
    print(f"📂 Loading Backup Data: {latest_backup_path}")
    
    try:
        df_backup = pd.read_csv(latest_backup_path)
    except FileNotFoundError:
         print(f"❌ memorial_spaces.csv not found in {backup_folders[0]}. Aborting.")
         return

    # Standardize columns for backup
    # Backup usually has: id, name, category, address, lat, lng, description, image_url...
    # We rename to target schema
    df_backup['legacy_id'] = df_backup['id']
    df_backup['is_verified'] = True
    df_backup['source'] = 'backup'
    # Ensure lat/lng are float
    df_backup['lat'] = pd.to_numeric(df_backup['lat'], errors='coerce')
    df_backup['lng'] = pd.to_numeric(df_backup['lng'], errors='coerce')

    # Process images: Convert single URL to Postgres Array format "{url}"
    if 'image_url' in df_backup.columns:
        df_backup['images'] = df_backup['image_url'].apply(
            lambda x: f"{{{str(x).strip()}}}" if pd.notna(x) and str(x).strip() != '' and str(x).lower() != 'nan' else None
        )
    else:
        df_backup['images'] = None

    print(f"   - Loaded {len(df_backup)} rows from backup.")

    # 2. Load Local CSVs
    print(f"📂 Loading Local Files from: {LOCAL_DIR}\\*.csv")
    
    # DEBUG: List parent dir to check encoding
    parent_dir = os.path.dirname(LOCAL_DIR)
    if os.path.exists(parent_dir):
        print(f"DEBUG: Contents of {parent_dir}:")
        for x in os.listdir(parent_dir):
            if '장' in x or '식' in x: print(f"  - CANDIDATE: {x} (Repr: {repr(x)})")
            
    # Use os.listdir instead of glob for better non-ASCII support
    if os.path.isdir(LOCAL_DIR):
        all_files = os.listdir(LOCAL_DIR)
        print(f"DEBUG: Files in {LOCAL_DIR}: {all_files}")
        local_files = [os.path.join(LOCAL_DIR, f) for f in all_files if f.lower().endswith('.csv')]
        print(f"DEBUG: Processed file list: {local_files}")
    else:
        print(f"⚠️ Directory not found: {LOCAL_DIR}")
        local_files = []
    
    all_local_data = []
    
    for f in local_files:
        try:
            # Local files might vary, but usually have headers like: 연번, 시설명, 주소, 전화번호, 위도, 경도...
            # We assume basic structure or fallback
            df = pd.read_csv(f)
            
            # Map common Korean headers to English
            col_map = {}
            for col in df.columns:
                if '시설명' in col or '업체명' in col or '장례식장명' in col or 'fac_tit' in col: col_map[col] = 'name'
                elif '주소' in col or '소재지' in col or 'fac_addr' in col: col_map[col] = 'address'
                elif '전화번호' in col or '연락처' in col or 'fac_tel' in col: col_map[col] = 'phone'
                elif '위도' in col: col_map[col] = 'lat'
                elif '경도' in col: col_map[col] = 'lng'
            
            df = df.rename(columns=col_map)
            # Remove duplicate columns if any (e.g. if 'address' existed and we also renamed 'fac_addr' to 'address')
            df = df.loc[:, ~df.columns.duplicated()]
            
            # Required cols check
            if 'name' not in df.columns:
                print(f"DEBUG: Skipping {os.path.basename(f)} - 'name' col not found. Columns: {list(df.columns)}")
                continue
                
            # Add missing cols
            if 'address' not in df.columns: df['address'] = ''
            if 'phone' not in df.columns: df['phone'] = None
            if 'lat' not in df.columns: df['lat'] = None
            if 'lng' not in df.columns: df['lng'] = None
            
            df['category_raw'] = '장례식장' # Local files are mostly funeral homes
            df['source'] = 'local'
            df['is_verified'] = False
            df['legacy_id'] = None
            df['images'] = None # Add empty images for local files
            
            all_local_data.append(df[['name', 'address', 'phone', 'lat', 'lng', 'is_verified', 'legacy_id', 'source', 'category_raw', 'images']])
            
        except Exception as e:
            print(f"⚠️ Error reading {f}: {e}")

    if all_local_data:
        df_local = pd.concat(all_local_data, ignore_index=True)
        # Clean local lat/lng
        df_local['lat'] = pd.to_numeric(df_local['lat'], errors='coerce')
        df_local['lng'] = pd.to_numeric(df_local['lng'], errors='coerce')
        print(f"   - Loaded {len(df_local)} rows from {len(local_files)} local files.")
    else:
        df_local = pd.DataFrame()
        print("   - No local data found.")

    # 3. Merge & Deduplicate
    print("🔄 Merging and Deduplicating...")
    
    # Combine
    # Backup cols needed: name, category, address, lat, lng, legacy_id, is_verified, phone (if exists)
    if 'phone' not in df_backup.columns: df_backup['phone'] = None
    
    # We need to map backup category raw to enum as well
    cols_to_keep = ['name', 'category', 'address', 'lat', 'lng', 'phone', 'legacy_id', 'is_verified', 'source', 'images']
    
    # Prepare backup DF
    df_backup['category_enum'] = df_backup.apply(lambda x: determine_category(x.get('category', ''), x['name']), axis=1)
    
    # Drop original category to avoid duplicates upon rename
    if 'category' in df_backup.columns:
        df_backup = df_backup.drop(columns=['category'])
        
    df_backup_final = df_backup.rename(columns={'category_enum': 'category'})
    # Ensure all cols exist
    for c in cols_to_keep:
        if c not in df_backup_final.columns: df_backup_final[c] = None
        
    # Prepare local DF
    if not df_local.empty:
        df_local['category'] = 'funeral_home' # Force local to funeral home as per instruction (or logic)
        # Actually logic says "Local files ... map to funeral_home mostly"
        df_local_final = df_local
    else:
        df_local_final = pd.DataFrame(columns=cols_to_keep)

    # Concatenate: Backup first (so it stays on dedupe keep='first' if we sort)
    # Actually we want to keep Backup if name matches.
    
    df_combined = pd.concat([df_backup_final[cols_to_keep], df_local_final[cols_to_keep]], ignore_index=True)
    
    # Deduplication Logic
    # Key: Name + Address(first 10 chars)
    df_combined['norm_name'] = df_combined['name'].astype(str).str.replace(' ', '').str.lower()
    df_combined['norm_addr'] = df_combined['address'].astype(str).str.replace(' ', '').str[:10]
    
    # Sort by source (backup < local) so backup is first?
    # No, we want backup to BE FIRST. 
    # 'source' values: 'backup', 'local'.
    # Sort: backup comes before local.
    df_combined.sort_values(by=['source'], ascending=True, inplace=True) # backup matches 'backup', local matches 'local'. 'b' < 'l'. Correct.
    
    before_count = len(df_combined)
    
    # distinct on name
    df_deduped = df_combined.drop_duplicates(subset=['norm_name', 'norm_addr'], keep='first')
    
    after_count = len(df_deduped)
    print(f"   - Deduplication: {before_count} -> {after_count} (Removed {before_count - after_count} duplicates)")
    
    # 4. Final Cleanup
    print("✨ Finalizing Data...")
    
    # Select final columns
    final_cols = ['name', 'category', 'address', 'lat', 'lng', 'phone', 'legacy_id', 'is_verified', 'images', 'location']
    df_deduped['location'] = df_deduped.apply(lambda x: create_wkt_point(x['lat'], x['lng']), axis=1)
    df_final = df_deduped[final_cols].copy()
    
    # Clean phone
    df_final['phone'] = df_final['phone'].apply(normalize_phone)
    
    # Export
    df_final.to_csv(OUTPUT_FILE, index=False, encoding='utf-8-sig')
    print(f"✅ Successfully saved {len(df_final)} rows to {OUTPUT_FILE}")

if __name__ == "__main__":
    run_etl()

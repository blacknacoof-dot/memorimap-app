import os
import time
import csv
import pandas as pd
import requests
import random
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# ==========================================
# 1. 설정
# ==========================================
CSV_FILE = '../memorial_spaces.csv'  # 프로젝트 루트에 있는 파일
BASE_DIR = 'memorial_data_v1'

# ==========================================
# 2. 준비
# ==========================================
if not os.path.exists(BASE_DIR):
    os.makedirs(BASE_DIR)

options = webdriver.ChromeOptions()
# options.add_argument('headless') # 화면 보려면 주석 처리
options.add_argument("--window-size=1200,800")
# 봇 탐지 방지
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
options.add_experimental_option("excludeSwitches", ["enable-automation"])
options.add_experimental_option('useAutomationExtension', False)

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
wait = WebDriverWait(driver, 10)

# ==========================================
# 3. 로직
# ==========================================
def download_image(url, save_path):
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            with open(save_path, 'wb') as f:
                f.write(response.content)
            return True
    except:
        return False
    return False

def crawl_and_save_local(row):
    f_id = str(row['id'])
    name = str(row['name'])
    address = str(row['address'])
    
    # 시설별 폴더 생성 (예: memorial_data/123_분당추모공원)
    safe_name = name.replace("/", "_").replace("\\", "_").replace(":", "") 
    folder_name = f"{f_id}_{safe_name}"
    folder_path = os.path.join(BASE_DIR, folder_name)
    
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)

    # 이미 이미지가 3장 이상 있으면 스킵 (재실행 시 편리함)
    if len([f for f in os.listdir(folder_path) if f.endswith('.jpg')]) >= 3:
        print(f"[스킵] 이미 완료: {name}")
        return None

    print(f"[검색] {name} ({address})")
    
    try:
        # 네이버 지도 검색
        query = f"{address} {name}"
        driver.get(f"https://map.naver.com/v5/search/{query}")
        time.sleep(3)
        
        # 프레임 진입 로직
        try:
            driver.switch_to.frame("searchIframe")
            # 첫 번째 결과 클릭
            driver.find_element(By.CSS_SELECTOR, "#_pcmap_list_scroll_container li:first-child a").click()
            driver.switch_to.default_content()
            time.sleep(2)
        except:
            driver.switch_to.default_content()

        wait.until(EC.presence_of_element_located((By.ID, "entryIframe")))
        driver.switch_to.frame("entryIframe")

        # [A] 이미지 탭 클릭 및 다운로드
        image_count = 0
        try:
            # 탭 메뉴에서 '사진' 찾기
            tabs = driver.find_elements(By.CSS_SELECTOR, ".veBoZ a, .rr_E_ a, .place_section_content a")
            photo_tab = None
            for t in tabs:
                if t.text == "사진":
                    photo_tab = t
                    break
            
            if photo_tab:
                photo_tab.click()
                time.sleep(2)
                
                # 이미지 요소 찾기 (네이버 지도 구조에 따라 다를 수 있음)
                imgs = driver.find_elements(By.CSS_SELECTOR, "div.wzrbN a img, .K0PDV")
                
                for idx, img in enumerate(imgs):
                    src = img.get_attribute("src")
                    if src and "http" in src and "map" not in src and "icon" not in src:
                        # 고화질 URL 변환 (선택)
                        src = src.replace("type=f180_180", "type=w500")
                        
                        save_name = f"{idx+1}.jpg"
                        if download_image(src, os.path.join(folder_path, save_name)):
                            image_count += 1
                            print(f"   [저장] {save_name}")
                        if image_count >= 5: break
            else:
                print("   [경고] 사진 탭을 찾을 수 없음")

        except Exception as e:
            print(f"   [경고] 사진 수집 중 오류: {e}")

        return {"id": f_id, "name": name, "folder": folder_name, "images": image_count}

    except Exception as e:
        print(f"[실패] 검색 오류: {e}")
        return None
    finally:
        driver.switch_to.default_content()

# ==========================================
# 4. 실행
# ==========================================
def main():
    if not os.path.exists(CSV_FILE):
        print(f"[오류] {CSV_FILE} 파일이 없습니다.")
        return

    # CSV 읽기 (Pandas 사용이 안전)
    try:
        df = pd.read_csv(CSV_FILE)
    except:
        # 인코딩 문제시 cp949 시도
        df = pd.read_csv(CSV_FILE, encoding='cp949')

    print(f"[시작] 총 {len(df)}개 시설 로컬 수집 시작...")

    count = 0
    # 테스트용: 앞에서 5개만 먼저 해보기 (전체 하려면 [:5] 제거)
    target_list = df  # df[:5] 로 테스트 가능

    for index, row in target_list.iterrows():
        # 이미지가 없는 것만 대상 (image_url이 비어있거나 null인 경우)
        # if pd.isna(row.get('image_url')): 
        crawl_and_save_local(row)
        
        count += 1
        if count % 10 == 0:
            print("[휴식] 5초 대기중...")
            time.sleep(5)

    driver.quit()
    print("\n[완료] 작업 완료! 'memorial_data_v1' 폴더를 확인하세요.")

if __name__ == "__main__":
    main()

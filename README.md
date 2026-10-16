# 버스 탑승 체크

행사 당일 버스 탑승자를 휴대폰으로 체크하는 웹앱입니다.
같은 주소를 여러 명이 열면 서로의 체크가 3초 안에 반영됩니다.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Foakhouse84-cloud%2Fbus-check&project-name=bus-check&repository-name=bus-check-app&env=ACCESS_CODE&envDescription=%EC%95%B1%20%EC%9E%85%EC%9E%A5%20%EC%BD%94%EB%93%9C%20%28%EB%8B%B4%EB%8B%B9%EC%9E%90%EB%81%BC%EB%A6%AC%EB%A7%8C%20%EA%B3%B5%EC%9C%A0%29&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22upstash%22%2C%22productSlug%22%3A%22upstash-kv%22%2C%22protocol%22%3A%22storage%22%7D%5D)

- 가는 버스(전원) / 오는 버스(숙박자) 따로 체크
- 이름·초성·전화 끝자리 검색, 가족 단위 한 번에 체크
- 불참 표시, 명단 외 인원 추가, 잘못된 명단 빼기·되돌리기
- 미탑승자 명단 복사(단톡방 공유용)
- 입장 코드를 아는 사람만 명단을 볼 수 있음
- **명단(이름·연락처)은 이 코드에 들어 있지 않습니다.** 배포 후 앱 화면에서 엑셀 파일을 올리면 Vercel 저장소에만 보관됩니다. 그래서 이 GitHub 저장소는 공개해도 됩니다.

---

## 배포 링크로 배포하기

1. **Deploy** 버튼(링크)을 누르고 Vercel에 로그인 (GitHub 계정으로 가능)
2. 저장소 이름 확인 → **Create**
3. **Upstash for Redis** 저장소 만들기 화면이 나오면 무료 플랜, 지역은 Tokyo 또는 Seoul 로 만들어 연결
4. `ACCESS_CODE` 칸에 입장 코드 입력 (예: `0418`)
5. **Deploy** → 1분쯤 뒤 주소가 나옵니다 (예: `https://bus-check-xxxx.vercel.app`)

## 처음 열었을 때

1. 입장 코드 입력
2. **명단 불러오기** 화면에서 버스 탑승자 엑셀 파일 선택 → 인원과 '확인 필요' 목록을 보고 **이 명단으로 시작**
3. 오른쪽 위가 **● 실시간 공유 중**(초록)인지 확인

담당자들에게는 주소와 입장 코드만 알려 주면 됩니다.
**임시 저장 · 저장소 미연결**(노랑)이 보이면 Upstash 연결이 빠진 것입니다.
Vercel 프로젝트 → Storage 탭에서 Upstash for Redis 를 연결하고 Redeploy 하세요.

### 엑셀 형식
- '버스'가 들어간 이름의 시트를 읽습니다 (없으면 첫 번째 시트).
- 머리글 줄에 `이름` 칸이 꼭 있어야 하고, `순번`, `연락처`, `구분`, `참석일`, `숙박`, `가족대표`, `비고` 칸이 있으면 함께 읽습니다.
- `숙박` 칸이 '숙박'인 사람이 오는 버스 명단에 들어갑니다. `숙박` 칸이 없으면 전원이 들어갑니다.
- 참석일이 비었거나, 같은 이름이 두 번 있거나, '자가용' 시트에도 있는 사람은 주황색으로 표시됩니다.
- 명단을 고친 뒤 화면 맨 아래 **명단 엑셀 파일 다시 불러오기** 로 바꿀 수 있습니다. 이미 한 체크는 순번 기준으로 유지됩니다.

---

## 다른 서버(Railway 등) 또는 내 컴퓨터

`npm start` 로 실행됩니다 (Node 18 이상). Vercel 전용 설정 없이 그대로 동작합니다.
- 환경변수 `ACCESS_CODE` 설정
- 기록 보관: Volume 을 `/data` 에 연결하고 `DATA_DIR=/data`, 또는 Upstash 환경변수 사용
- 시험: `ACCESS_CODE=1234 npm start` → http://localhost:3000

## 환경변수

| 이름 | 설명 |
|---|---|
| `ACCESS_CODE` | 입장 코드. 비우면 누구나 접속 가능 (권장하지 않음) |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Upstash 연결 시 자동 설정 (`KV_REST_API_URL`, `KV_REST_API_TOKEN` 도 인식) |
| `DATA_DIR` | Redis 없이 일반 서버에서 쓸 때 저장 폴더 (기본 `./data`) |
| `STORE_PREFIX` | 저장 키 앞부분. 다른 행사에 다시 쓸 때 바꾸면 기록이 섞이지 않음 |

## 행사 후
연락처가 저장되어 있으므로 행사가 끝나면 Vercel 프로젝트(Settings → Delete Project)와 Upstash 저장소를 삭제하세요.

## 파일 구성
```
public/index.html   앱 화면
api/state.js        명단 + 체크 상태 조회
api/action.js       체크·추가·빼기 저장
api/roster.js       엑셀에서 읽은 명단 저장
lib/store.js        저장소 (Upstash Redis / 파일)
lib/http.js         입장 코드 확인
server.js           Vercel 외 일반 서버용 실행 파일
```

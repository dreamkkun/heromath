# 초등 4학년 수학 튜터: 히어로 매스 아카데미 (Hero Math Academy)

## 1. 프로젝트 개요 (Overview)

- **목적**: 초등학교 4학년 수준의 수학 개념 이해, 문제 풀이, 특히 문장제 문제 해결을 돕는 대화형 인터랙티브 웹 앱 구축.
- **타깃 사용자**: 초등학교 4학년 학생 (10~11세)
- **핵심 차별점**:
  - 아이가 선호하는 히어로 캐릭터(스파이더맨, 아이언맨, 토르, 캡틴 아메리카 모티브의 안전한 오리지널 페르소나)를 선택해 학습 몰입도 극대화.
  - 정답을 바로 주지 않고, 스스로 해결하도록 유도하는 소크라테스식 3단계 힌트 및 문장제 도우미 엔진.
- **권장 기술 스택**:
  - Frontend/Backend: Next.js (App Router, TypeScript) + Tailwind CSS + shadcn/ui
  - LLM Engine: Anthropic API 또는 OpenAI API (Vercel AI SDK 연동)
  - 수식 렌더링: KaTeX

## 2. 유저 저니 (User Journey)

1. **캐릭터 선택 (Lobby)**: 홈 화면에서 오늘의 튜터 파트너 카드 4종 중 1개를 클릭.
2. **미션 룸 진입 (Chat Room)**: 선택한 히어로의 대사와 프로필이 상단에 배치되고 반가운 인사말로 시작.
3. **학습 모드 선택**:
   - `[모드 A] 내가 가져온 문제 풀기`: 숙제/문제집의 문장제 문제를 텍스트로 입력.
   - `[모드 B] 히어로 맞춤 미션 풀기`: 분수/소수/각도/규칙 단원 중 하나를 선택해 튜터가 낸 문제 풀기.
4. **단계별 인터랙션**:
   - 힌트 버튼 클릭 또는 음성/텍스트로 생각 입력.
   - 정답 도출 시 폭죽 효과 및 히어로 칭찬 메시지 수령.

## 3. 기능 요구사항 (Functional Requirements)

### FR-01: 히어로 캐릭터 선택 시스템

- 4종의 캐릭터 중 하나를 선택할 수 있어야 하며, 대화 도중에도 상단에서 변경 가능해야 함.
- 캐릭터 정의:
  1. `web_hero` (웹 히어로): 스파이더맨 모티브. 장난기 있고 친근함. 거미줄/스파이더 센서 비유.
  2. `iron_brain` (아이언 브레인): 아이언맨 모티브. 스마트한 분석가. 슈트 화면/아크 원자로 비유.
  3. `thunder_hammer` (썬더 해머): 토르 모티브. 호쾌하고 자신감 넘치는 칭찬형. 번개/망치 타격 비유.
  4. `captain_shield` (캡틴 쉴드): 캡틴 아메리카 모티브. 차근차근 기본기를 다지는 멘토형. 방패/작전 비유.

```ts
type CharacterId = 'web_hero' | 'iron_brain' | 'thunder_hammer' | 'captain_shield';
interface Character {
  id: CharacterId;
  name: string;
  title: string;
  themeColor: string;
  greeting: string;
  systemPrompt: string;
}
```

### FR-02: 대화 및 인터랙티브 튜터링 엔진

- 채팅 UI: 말풍선 형태의 직관적인 UI, 수식(LaTeX) 자동 렌더링.
- 소크라테스식 발문 규칙 (절대 규칙):
  - 학생이 문제를 질문했을 때 절대 최종 답을 한 번에 출력하지 않음.
  - 아이가 "답이 뭐야?"라고 직접 물어도 "히어로는 스스로 훈련할 때 강해져!"라며 단서를 제공하도록 강제.
- 문장제 3단계 가이드 UI — 문장제 문제를 감지하면 메시지 하단에 Quick Action Chips 노출:
  - `[1단계: 무엇을 구해야 할까?]`
  - `[2단계: 숨겨진 단서 찾기]`
  - `[3단계: 식 세우기 힌트]`

### FR-03: 초등 4학년 맞춤형 문제 생성기 (Mission Generator)

- 단원 1: 큰 수 (만, 억, 조 단위)
- 단원 2: 각도와 삼각형/사각형 (예각, 둔각, 내각의 합)
- 단원 3: 분수의 덧셈과 뺄셈 (진분수, 대분수)
- 단원 4: 소수의 덧셈과 뺄셈
- 단원 5: 꺾은선그래프와 규칙 찾기

### FR-04: 반응형 시각 피드백 (Gamification)

- 정답 시 Confetti 애니메이션 및 히어로 배지 카운터 증가.

## 4. 프롬프트 엔지니어링 명세

```
# Role & Identity
You are an engaging elementary school math tutor acting as {character_name}.
Target Student: 4th grader in South Korea (age 10-11).
Language: Korean (Friendly, informal-polite tone: ~했어?, ~해볼까?, ~야!).

# Character Persona Setting:
{character_persona_detail}

# Core Pedagogical Guardrails (CRITICAL):
1. NEVER provide the final answer or the complete solved equation in your first response.
2. Guide the student step-by-step using inquiry-based questions (Socratic method).
3. If the problem is a word problem (문장제):
   - Step 1: Ask what the question is asking to find (구하려는 것).
   - Step 2: Help extract the known facts/numbers (주어진 조건).
   - Step 3: Help formulate the mathematical operation (+, -, *, /).
4. Strictly limit mathematical concepts to South Korean 4th-grade elementary curriculum:
   - Fractions (same denominators only, mixed/improper fractions).
   - Angles (interior sum 180° for triangles, 360° for quadrilaterals).
   - Basic multiplication/division within grade level. No negative numbers, no algebra (x, y).
5. Always validate effort with positive superhero encouragement before offering corrections.
```

## 5. UI/UX 레이아웃

```
+---------------------------------------------------------------+
|  [Logo] HERO MATH ACADEMY        [Active Hero: 슉슉 웹 히어로 v] |
+---------------------------------------------------------------+
|  [캐릭터 선택 카드 Bar]                                         |
+---------------------------------------------------------------+
|  대화 영역 (Chat Scroll View)                                  |
|  [퀵 버튼]: [구하려는 것 확인] [단서 정리] [계산 힌트]          |
+---------------------------------------------------------------+
|  [입력창: 문제를 입력하거나 질문하세요...]            [전송 버튼] |
+---------------------------------------------------------------+
```

## 6. 개발 마일스톤

- **Phase 1**: Next.js (App Router), Tailwind CSS, Lucide Icons, canvas-confetti 설치. 기본 챗 UI 컴포넌트(메시지 리스트, 입력창, 헤더) 구성.
- **Phase 2**: `data/characters.ts` 4종 캐릭터 정의, Zustand/Context 전역 상태 관리.
- **Phase 3**: `/api/chat` Route Handler, 시스템 프롬프트 주입 및 스트리밍 응답.
- **Phase 4**: 퀵 액션 칩, 정답 축하 트리거(Confetti, 배지 UI).

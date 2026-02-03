import type { FavoriteAnalysis } from '@/types/favorites';

/**
 * 사용자 활동 데이터를 기반으로 규칙 기반(Rule-based) 인사이트 메시지 생성
 * 실제 AI 호출 비용을 절감하면서도 개인화된 느낌을 줌
 */
export function generateRuleBasedInsight(analysis: FavoriteAnalysis | null): string {
    if (!analysis || analysis.total_favorites === 0) {
        return "아직 찜한 시설이 없으시네요. 마음에 드는 곳을 찾아보세요.";
    }

    const { most_common_category, total_favorites, has_memo_count } = analysis;

    // 카테고리별 멘트
    let categoryMessage = "";
    switch (most_common_category) {
        case '수목장':
        case '자연장':
            categoryMessage = "자연과 하나되는 평온한 안식처를 선호하시네요 🌿";
            break;
        case '봉안당':
        case '납골당':
            categoryMessage = "정갈하고 관리가 잘 되는 실내 안치단을 눈여겨보고 계시군요 ✨";
            break;
        case '장례식장':
            categoryMessage = "접근성과 시설의 편의성을 중요하게 생각하시는 것 같아요 🏥";
            break;
        case '공원묘지':
            categoryMessage = "탁 트인 전경과 가족들이 모이기 좋은 공원형 묘역을 찾으시네요 🌳";
            break;
        default:
            categoryMessage = "다양한 장묘 시설들을 꼼꼼하게 비교하고 계시네요 🧐";
    }

    // 찜 개수와 메모 여부에 따른 부가 멘트
    let subMessage = "";
    if (has_memo_count > 0) {
        subMessage = " 꼼꼼하게 메모하신 내용들이 나중에 큰 도움이 될 거예요.";
    } else if (total_favorites >= 5) {
        subMessage = " 충분한 후보지를 모으셨군요. 이제 직접 방문해볼까요?";
    } else {
        subMessage = " 후보지를 몇 군데 더 찜해서 비교해보시는 건 어떨까요?";
    }

    return `${categoryMessage}${subMessage}`;
}

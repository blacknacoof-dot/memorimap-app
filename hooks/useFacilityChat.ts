import { useSession } from '../lib/auth';
import { getAuthClient } from '../lib/supabaseClient';

interface FunctionCallPayload {
    name: string;
    args: Record<string, string>;
}

interface CurrentUser {
    id: string;
}

interface FunctionCallResult {
    success?: boolean;
    reservation_id?: string;
    contract_id?: string;
    message?: string;
    error?: string;
    shouldRetry?: boolean;
}

export const useFacilityChat = () => {
    const { session } = useSession();

    const handleFunctionCall = async (functionCall: FunctionCallPayload, currentUser: CurrentUser | null): Promise<FunctionCallResult> => {
        const { name, args } = functionCall;
        try {
            const client = await getAuthClient(session, { strict: true });

            switch (name) {
                case 'book_facility_visit': {
                    // 입력 검증
                    if (!args.visitor_phone.match(/^010-\d{4}-\d{4}$/)) {
                        return {
                            error: '전화번호 형식이 올바르지 않습니다 (010-xxxx-xxxx)',
                            shouldRetry: true
                        };
                    }

                    // DB 트랜잭션 실행
                    const { data, error } = await client
                        .from('reservations')
                        .insert({
                            facility_id: args.facility_id,
                            user_id: currentUser?.id,
                            visitor_name: args.visitor_name,
                            visitor_phone: args.visitor_phone,
                            visit_date: args.preferred_date,
                            time_slot: args.preferred_time,
                            special_requests: args.special_requests,
                            status: 'pending',
                        })
                        .select()
                        .single();

                    if (error) throw error;

                    return {
                        success: true,
                        reservation_id: data.id,
                        message: `예약이 접수되었습니다. 예약번호 [${data.id.slice(0, 8)}]`
                    };
                }

                case 'create_sangjo_contract': {
                    // 상조 계약 생성 로직
                    const { resolveSangjoDbId } = await import('../lib/sangjoQueries');
                    const dbId = await resolveSangjoDbId(
                        args.sangjo_company_id || '',
                        args.company_name || args.sangjo_company_id || '',
                        client
                    );
                    const contractNum = `REQ-2026-${Math.floor(Math.random() * 900000 + 100000)}`;
                    const { data, error } = await client
                        .from('sangjo_contracts')
                        .insert({
                            id: crypto.randomUUID(),
                            contract_number: contractNum,
                            sangjo_id: dbId,
                            customer_name: args.customer_name || '',
                            customer_phone: args.customer_phone || '',
                            service_type: args.package_type || '채팅 상담',
                            status: '상담신청',
                            application_type: 'CONSULTATION',
                            total_price: 0,
                            emergency_level: 'normal',
                            created_at: new Date().toISOString(),
                        })
                        .select()
                        .single();

                    if (error) throw error;

                    return {
                        success: true,
                        contract_id: data.id,
                        message: `계약 신청이 완료되었습니다. 담당자가 24시간 내 연락드립니다.`
                    };
                }

                default:
                    console.warn(`Unknown function: ${name}`);
                    return { error: `지원하지 않는 기능입니다: ${name}`, shouldRetry: false };
            }
        } catch (error) {
            console.error('Function call error:', error);
            return {
                error: '처리 중 시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
                shouldRetry: false
            };
        }
    };

    return { handleFunctionCall };
};

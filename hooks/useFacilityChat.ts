import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useFacilityChat = () => {

    const handleFunctionCall = async (functionCall: any, currentUser: any) => {
        const { name, args } = functionCall;
        console.log(`[Function Calling] Executing ${name} with args:`, args);

        try {
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
                    const { data, error } = await supabase
                        .from('reservations')
                        .insert({
                            facility_id: args.facility_id,
                            user_id: currentUser?.id,
                            visitor_name: args.visitor_name,
                            visitor_phone: args.visitor_phone,
                            visit_date: args.preferred_date, // Note: Schema might use visit_date (date) and time_slot (string) separately
                            time_slot: args.preferred_time,
                            // preferred_datetime: `${args.preferred_date}T${args.preferred_time}:00`, // Alternative if timestamp
                            // consultation_type: args.consultation_type, // Add column if exists
                            special_requests: args.special_requests,
                            status: 'pending',
                            // created_at: new Date().toISOString() // Default default
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
                    const { data, error } = await supabase
                        .from('sangjo_contracts')
                        .insert({
                            sangjo_company_id: args.sangjo_company_id,
                            user_id: currentUser?.id,
                            customer_name: args.customer_name,
                            customer_phone: args.customer_phone,
                            // customer_ssn_partial: args.customer_ssn, // Add if column exists
                            package_type: args.package_type,
                            monthly_payment: args.monthly_payment,
                            status: 'pending'
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

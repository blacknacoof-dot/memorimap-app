import React, { useState } from 'react';
import { X, Shield, FileText } from 'lucide-react';

interface Props {
    onClose: () => void;
}

export const LegalModal: React.FC<Props> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'privacy' | 'license'>('privacy');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-lg text-gray-800">서비스 정책 및 정보</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('privacy')}
                        className={`flex-1 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'privacy'
                            ? 'border-primary text-primary bg-primary/5'
                            : 'border-transparent text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        개인정보 처리방침
                    </button>
                    <button
                        onClick={() => setActiveTab('license')}
                        className={`flex-1 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'license'
                            ? 'border-primary text-primary bg-primary/5'
                            : 'border-transparent text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        오픈소스 라이선스
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 text-sm leading-relaxed text-gray-600">
                    {activeTab === 'privacy' ? (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-gray-800 mb-2">개인정보 처리방침</h3>
                            <p className="font-medium text-gray-800">(주)아톰케어 (이하 '회사')는 정보통신망 이용촉진 및 정보보호 등에 관한 법률 등 모든 관련 법령을 준수하며, 이용자의 개인정보를 보호하기 위해 최선을 다하고 있습니다.</p>

                            <h4 className="font-bold text-gray-800 mt-4">1. 수집하는 개인정보의 항목</h4>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>필수항목: 이름, 이메일, 프로필 이미지 (소셜 로그인 시)</li>
                                <li>선택항목: 전화번호</li>
                                <li>서비스 이용 과정에서 자동 수집: 접속 로그, 쿠키, 기기 정보</li>
                            </ul>

                            <h4 className="font-bold text-gray-800 mt-4">2. 개인정보의 수집 및 이용 목적</h4>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>서비스 제공: 시설 예약, 상담, 리뷰 관리</li>
                                <li>회원 관리: 본인 확인, 불량 회원의 부정 이용 방지와 비인가 사용 방지</li>
                                <li>마케팅 및 광고: 신규 서비스 개발, 이벤트 정보 전달 (동의 시)</li>
                            </ul>

                            <h4 className="font-bold text-gray-800 mt-4">3. 개인정보의 보유 및 이용 기간</h4>
                            <p>회사는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계 법령에 따라 보존할 필요가 있는 경우 일정 기간 보관합니다.</p>

                            <h4 className="font-bold text-gray-800 mt-4">4. 문의처</h4>
                            <p>개인정보 관련 문의는 고객센터로 연락 주시기 바랍니다.</p>
                            <p className="text-gray-500 mt-2 text-xs">시행일자: 2024년 1월 1일</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-gray-800 mb-2">오픈소스 라이선스 고지</h3>
                            <p>본 서비스는 (주)아톰케어에서 개발 및 운영하며, 다음의 오픈소스 소프트웨어를 포함하고 있습니다.</p>

                            <div className="bg-gray-50 p-4 rounded-lg border text-xs font-mono space-y-3">
                                <div>
                                    <strong className="block text-gray-800 mb-1">React & React DOM</strong>
                                    <p>MIT License / Copyright (c) Meta Platforms, Inc.</p>
                                </div>
                                <hr className="border-gray-200" />
                                <div>
                                    <strong className="block text-gray-800 mb-1">Leaflet & React-Leaflet</strong>
                                    <p>BSD-2-Clause / MIT License</p>
                                </div>
                                <hr className="border-gray-200" />
                                <div>
                                    <strong className="block text-gray-800 mb-1">Lucide React</strong>
                                    <p>ISC License / Copyright (c) Lucide Contributors</p>
                                </div>
                                <hr className="border-gray-200" />
                                <div>
                                    <strong className="block text-gray-800 mb-1">Supabase Client</strong>
                                    <p>MIT License</p>
                                </div>
                                <hr className="border-gray-200" />
                                <div>
                                    <strong className="block text-gray-800 mb-1">Clerk React</strong>
                                    <p>MIT License</p>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500 mt-4">
                                각 라이선스의 전문은 해당 프로젝트의 저장소 또는 배포 패키지 내 포함된 LICENSE 파일에서 확인할 수 있습니다.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer info */}
                <div className="p-4 bg-gray-50 border-t text-center">
                    <p className="text-xs text-gray-400">© 2024 (주)아톰케어 All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

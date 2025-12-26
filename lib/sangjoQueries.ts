import { supabase } from './supabaseClient';

import { SangjoContract } from '../types';

export interface SangjoTimelineEvent {
    id: string;
    contract_number: string;
    event: string;
    notes?: string;
    photo_url?: string;
    created_at: string;
}

export const saveSangjoContract = async (contract: SangjoContract) => {
    const { data, error } = await supabase
        .from('sangjo_contracts')
        .insert([contract]);

    if (error) {
        console.error('Error saving sangjo contract:', error);
        throw error;
    }
    return data;
};

export const getSangjoContracts = async (sangjoId: string) => {
    const { data, error } = await supabase
        .from('sangjo_contracts')
        .select('*')
        .eq('sangjo_id', sangjoId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching sangjo contracts:', error);
        throw error;
    }
    return data;
};

export const updateContractStatus = async (contractNumber: string, status: string, additionalData: any = {}) => {
    const { data, error } = await supabase
        .from('sangjo_contracts')
        .update({
            status,
            ...additionalData
        })
        .eq('contract_number', contractNumber);

    if (error) {
        console.error('Error updating contract status:', error);
        throw error;
    }
    return data;
};

export const addTimelineEvent = async (contractNumber: string, event: string, notes?: string, photoUrl?: string) => {
    const { data, error } = await supabase
        .from('sangjo_contract_timeline')
        .insert([{
            contract_number: contractNumber,
            event,
            notes,
            photo_url: photoUrl,
            created_at: new Date().toISOString()
        }]);

    if (error) {
        console.error('Error adding timeline event:', error);
        throw error;
    }
    return data;
};

export const getTimelineEvents = async (contract_number: string) => {
    const { data, error } = await supabase
        .from('sangjo_contract_timeline')
        .select('*')
        .eq('contract_number', contract_number)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching timeline events:', error);
        throw error;
    }
    return data as SangjoTimelineEvent[];
};

export const getSangjoUser = async (userId: string) => {
    const { data, error } = await supabase
        .from('sangjo_dashboard_users')
        .select('sangjo_id, role, name')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        console.error('Error fetching sangjo user:', error);
        return null;
    }
    return data;
};

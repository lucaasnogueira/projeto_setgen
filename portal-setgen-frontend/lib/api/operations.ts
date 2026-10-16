import api from './client';
import { ClientProcess, CalendarVisit } from '@/app/(portal)/operations/data/mock-operations';

export interface PipelineSummary {
  totalProcesses: number;
  inProgress: number;
  awaitingClosing: number;
  completed: number;
  lost: number;
  totalSold: number;
  totalReceived: number;
}

export interface PipelineResponse {
  processes: ClientProcess[];
  summary: PipelineSummary;
}

export const operationsApi = {
  async getPipeline(): Promise<PipelineResponse> {
    try {
      const { data } = await api.get('/operations/pipeline');
      return data;
    } catch (error) {
      console.error('Erro ao buscar esteira de operações da API:', error);
      throw error;
    }
  },

  async getCalendar(startDate?: string, endDate?: string): Promise<CalendarVisit[]> {
    try {
      const { data } = await api.get('/operations/calendar', {
        params: { startDate, endDate },
      });
      return data;
    } catch (error) {
      console.error('Erro ao buscar visitas do calendário da API:', error);
      throw error;
    }
  },

  async updateStageStatus(processId: string, stageId: string, status: string): Promise<any> {
    try {
      const { data } = await api.patch(`/operations/processes/${processId}/stages/${stageId}`, { status });
      return data;
    } catch (error) {
      console.error('Erro ao atualizar status da etapa na API:', error);
      throw error;
    }
  },
};


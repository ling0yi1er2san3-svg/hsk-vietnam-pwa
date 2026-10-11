import { create } from 'zustand';
import type { ImportReport } from '../types/vocabulary';
import { importHskWorkbook } from '../services/excelService';

interface ImportState {
  importing: boolean;
  report?: ImportReport;
  error?: string;
  importFile: (file: File) => Promise<void>;
}

export const useImportStore = create<ImportState>((set) => ({
  importing: false,
  report: undefined,
  error: undefined,
  importFile: async (file) => {
    set({ importing: true, error: undefined });
    try {
      const report = await importHskWorkbook(file);
      set({ report, importing: false });
      window.dispatchEvent(new CustomEvent('hsk-data-changed'));
    } catch (error) {
      set({
        importing: false,
        error: error instanceof Error ? error.message : 'Không thể import file Excel.'
      });
    }
  }
}));

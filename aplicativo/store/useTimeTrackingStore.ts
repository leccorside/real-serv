import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import { TimeRecord } from '@/types';
import { API_CONFIG } from '@/constants/api';
import { useAuthStore } from './useAuthStore';
import * as ImageManipulator from 'expo-image-manipulator';

interface TimeTrackingState {
  records: TimeRecord[];
  pendingSyncRecords: TimeRecord[];
  isSyncing: boolean;
  addRecord: (record: TimeRecord) => void;
  syncRecords: (syncedRecords: TimeRecord[]) => void;
  simulateSync: () => Promise<void>;
  clearRecords: () => void;
  getTodayRecords: () => TimeRecord[];
  fetchTodayRecords: (userId: string) => Promise<void>;
}

export const useTimeTrackingStore = create<TimeTrackingState>()(
  persist(
    (set, get) => ({
      records: [],
      pendingSyncRecords: [],
      isSyncing: false,
      
      fetchTodayRecords: async (userId) => {
        try {
          const { user } = useAuthStore.getState();
          const buscaId = user?.re || userId;
          
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const today = `${year}-${month}-${day}`;
          
          const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.PONTO_URL}?busca=${buscaId}&dataInicial=${today}&dataFinal=${today}`);
          
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (Array.isArray(data)) {
              const mappedRecords: TimeRecord[] = [];
              data.forEach(db => {
                const recordDate = db.DataRegistro.split(' ')[0];
                const baseId = db.Id.toString();
                const uid = db.RE;

                const formatTimePart = (time: string) => {
                  if (!time) return null;
                  const parts = time.trim().split(':');
                  if (parts.length === 2) return `${time.trim()}:00`;
                  if (parts.length === 3) {
                    return `${parts[0]}:${parts[1]}:${parts[2].split('.')[0]}`;
                  }
                  return time.trim();
                };

                if (db.Entrada) mappedRecords.push({ id: `${baseId}_ENTRADA`, userId: uid, type: 'ENTRADA', timestamp: `${recordDate}T${formatTimePart(db.Entrada)}`, synced: true } as TimeRecord);
                if (db.AlmocoSaida) mappedRecords.push({ id: `${baseId}_SAIDA_ALMOCO`, userId: uid, type: 'SAIDA_ALMOCO', timestamp: `${recordDate}T${formatTimePart(db.AlmocoSaida)}`, synced: true } as TimeRecord);
                if (db.AlmocoRetorno) mappedRecords.push({ id: `${baseId}_RETORNO_ALMOCO`, userId: uid, type: 'RETORNO_ALMOCO', timestamp: `${recordDate}T${formatTimePart(db.AlmocoRetorno)}`, synced: true } as TimeRecord);
                if (db.Saida) mappedRecords.push({ id: `${baseId}_SAIDA`, userId: uid, type: 'SAIDA', timestamp: `${recordDate}T${formatTimePart(db.Saida)}`, synced: true } as TimeRecord);
              });
              
              // REGRA: Quando online, sobrescrever APENAS os registros sincronizados.
              // Manter apenas os pendingSyncRecords que ainda nao foram confirmados pelo servidor.
              set((state) => {
                const confirmedTypes = new Set(mappedRecords.map(r => r.type));
                const stillPending = state.pendingSyncRecords.filter(
                  p => !confirmedTypes.has(p.type) && p.timestamp.startsWith(today)
                );
                return { records: mappedRecords, pendingSyncRecords: stillPending };
              });
            }
          } else {
            const text = await response.text();
            console.error('Resposta inesperada do servidor (não JSON):', text.substring(0, 50));
          }
        } catch (error) {
          console.error('Erro ao buscar registros:', error);
        }
      },

      addRecord: (record) => {
        console.log(`[ADD] Adicionando registro: tipo=${record.type}, userId=${record.userId}, synced=${record.synced}`);
        // Garantir que registros locais novos usem o formato de data consistente
        set((state) => ({
          records: [...state.records, record],
          pendingSyncRecords: record.synced 
            ? state.pendingSyncRecords 
            : [...state.pendingSyncRecords, record]
        }));
        console.log(`[ADD] pendingSyncRecords agora: ${get().pendingSyncRecords.length} registros`);
        
        // Auto-engatilhar sync em background sempre que registrar um novo ponto
        setTimeout(() => {
          get().simulateSync();
        }, 500);
      },
      
      syncRecords: (syncedRecords) => {
        set((state) => {
          const syncedIds = syncedRecords.map(r => r.id);
          return {
            records: state.records.map(record => 
              syncedIds.includes(record.id) ? { ...record, synced: true } : record
            ),
            pendingSyncRecords: state.pendingSyncRecords.filter(
              record => !syncedIds.includes(record.id)
            )
          };
        });
      },

      simulateSync: async () => {
        const { pendingSyncRecords, syncRecords, isSyncing } = get();
        console.log(`[SYNC] simulateSync chamado. pendentes=${pendingSyncRecords.length}, isSyncing=${isSyncing}`);
        if (pendingSyncRecords.length === 0 || isSyncing) {
          console.log('[SYNC] Retornando cedo: fila vazia ou já sincronizando');
          return;
        }

        set({ isSyncing: true });
        console.log('[SYNC] Iniciando sync da fila...');

        // Timeout de segurança: se por algum motivo o sync travar, resetar após 30s
        const safetyTimer = setTimeout(() => {
          const currentState = get();
          if (currentState.isSyncing) {
            console.warn('[SYNC] Timeout de segurança ativado - resetando isSyncing');
            set({ isSyncing: false });
          }
        }, 30000);

        try {
          const syncedRecords: TimeRecord[] = [];
          for (const record of pendingSyncRecords) {
            let photoBase64 = record.photo || '';
            
            // Se a foto for uma URI local (file://), precisamos comprimir para mandar super leve
            if (photoBase64) {
              const isLocalFile = photoBase64.startsWith('file://') || photoBase64.startsWith('content://');
              
              if (isLocalFile) {
                try {
                  const manipResult = await ImageManipulator.manipulateAsync(
                    photoBase64,
                    [{ resize: { width: 800 } }], // Achata a imagem brutalmente para os 800px previnindo derrubar o IIS do C#
                    { base64: true, compress: 0.6 }
                  );
                  photoBase64 = manipResult.base64 || '';
                } catch (e) {
                  console.error("Erro ao converter e comprimir arquivo local da câmera para Base64:", e);
                }
              }
            }

            const usuarioIdToSubmit = useAuthStore.getState().user?.id || record.userId;
            // Identifica se é registro offline que gravou apena o CPF limpo no record.userId
            const isCpfFlag = !useAuthStore.getState().user?.id && /^\d{11,14}$/.test(usuarioIdToSubmit);
            console.log(`[SYNC] Enviando: usuarioId=${usuarioIdToSubmit}, isCpf=${isCpfFlag}, tipo=${record.type}, foto=${photoBase64.length} chars`);

            // Usar URLSearchParams em vez de FormData para compatibilidade com ASP.NET ASHX
            const params = new URLSearchParams();
            params.append('usuarioId', usuarioIdToSubmit);
            params.append('isCpf', isCpfFlag ? 'true' : 'false');
            params.append('latitude', record.location?.latitude?.toString() || '');
            params.append('longitude', record.location?.longitude?.toString() || '');
            params.append('foto', photoBase64);
            params.append('tipoBatida', record.type);

            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.PONTO_URL}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: params.toString(),
            });

            console.log(`[SYNC] HTTP ${response.status}`);
            let result;
            try {
              const contentType = response.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                result = await response.json();
                console.log('[SYNC] Servidor:', JSON.stringify(result));
              } else {
                 const text = await response.text();
                 console.log('[SYNC] Resp texto:', text.substring(0, 200));
                 if (response.status === 200) {
                    syncedRecords.push(record);
                    continue;
                 }
                console.error('[SYNC] Servidor retornou erro não-JSON');
                continue;
              }
            } catch (e) {
              console.error('[SYNC] Falha no parse do JSON:', e);
              if (response.status === 200) {
                syncedRecords.push(record);
              }
              continue;
            }

            if (result.status === 'ok' || (result.status === 'error' && result.message?.includes('ja realizou'))) {
              syncedRecords.push(record);
              console.log(`[SYNC] ✓ Sincronizado: ${record.id}`);
            } else {
              console.warn(`[SYNC] ✗ Rejeitado pelo servidor: ${result?.message}`);
            }
          }

          console.log(`[SYNC] Total sincronizados: ${syncedRecords.length}/${pendingSyncRecords.length}`);

          if (syncedRecords.length > 0) {
            syncRecords(syncedRecords);
            
            // Após sincronizar, re-buscar do servidor para atualizar UI e bloquear botões
            // Fallback: usa o userId do próprio registro (CPF) se não houver usuário logado
            const { user } = useAuthStore.getState();
            const fetchId = user?.re || user?.id || syncedRecords[0]?.userId || '';
            if (fetchId) {
              await get().fetchTodayRecords(fetchId);
            }
          }
        } catch (error) {
          console.error('Erro ao sincronizar pontos:', error);
        } finally {
          clearTimeout(safetyTimer);
          set({ isSyncing: false });
        }
      },

      clearRecords: () => set({ records: [], pendingSyncRecords: [] }),

      getTodayRecords: () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;
        
        return get().records.filter(record => record.timestamp.startsWith(today));
      }
    }),
    {
      name: 'time-tracking-storage',
      storage: createJSONStorage(() => zustandStorage),
      // Persist apenas records e pendingSyncRecords.
      // isSyncing NUNCA deve ser salvo - se travado como true, bloqueia todo sync futuro.
      partialize: (state) => ({
        records: state.records,
        pendingSyncRecords: state.pendingSyncRecords,
      }),
      // Garante que isSyncing sempre comece como false após recarregar o app,
      // mesmo que dados antigos no storage tivessem isSyncing: true
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isSyncing = false;
        }
      },
    }
  )
);

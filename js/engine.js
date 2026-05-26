// Motor principal lógico do jogo

const GameEngine = {
    state: {
        day: 1,
        reputation: 5,
        money: 1000,
        moral: 50,
        level: 1,
        history: []
    },

    saveGame: function() {
        localStorage.setItem("17bbm_save", JSON.stringify(this.state));
    },

    loadGame: function() {
        const saved = localStorage.getItem("17bbm_save");
        if (saved) {
            this.state = JSON.parse(saved);
            return true;
        }
        return false;
    },

    hasSave: function() {
        return localStorage.getItem("17bbm_save") !== null;
    },

    resetGame: function(difficulty = 'normal') {
        const diff = GameData.difficulties[difficulty] || GameData.difficulties.normal;

        const shuffle = (array) => {
            let currentIndex = array.length, randomIndex;
            while (currentIndex !== 0) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;
                [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
            }
            return array;
        };

        const bcs   = shuffle(GameData.characters.filter(c => c.name.startsWith('BC')));
        const sgts  = shuffle(GameData.characters.filter(c => c.name.startsWith('SGT') || c.name.startsWith('SUB')));
        const tens  = shuffle(GameData.characters.filter(c => c.name.startsWith('TEN')));
        const shuffledVehicles = shuffle([...GameData.vehicles]);

        // Adiciona energia e missões despachadas a cada militar
        const assignEnergy = (c) => ({ ...c, energy: 100, missionCount: 0, dayMissions: 0 });

        const goals = GameData.weeklyGoals;
        const firstGoal = { ...goals[Math.floor(Math.random() * goals.length)] };

        this.state = {
            day: 1,
            reputation: 5,
            money: diff.startMoney,
            moral: 50,
            level: 1,
            difficulty: difficulty,
            campaignName: '',
            history: [],
            troop: [
                assignEnergy(tens[0]),   // 1 TEN aleatório
                assignEnergy(sgts[0]),   // 1 SGT ou SUB aleatório
                assignEnergy(bcs[0]),    // BC #1 aleatório
                assignEnergy(bcs[1]),    // BC #2 aleatório
            ],
            fleet: [
                { ...shuffledVehicles[0] },
                { ...shuffledVehicles[1] }
            ],
            activeOccurrences: [],
            tcMatosDayTarget: Math.floor(Math.random() * 10) + 5,
            tcMatosVisited: false,
            weeklyGoal: firstGoal,
            weeklyProgress: 0,
            weeklyStartDay: 1,
            consecutiveSuccesses: 0,
        };
        this.saveGame();
    },

    generateOccurrence: function() {
        if (!this.state.activeOccurrences) this.state.activeOccurrences = [];
        if (this.state.activeOccurrences.length >= 3) return;

        // 25% de chance de dia tranquilo (só se não houver ocorrências pendentes)
        if (this.state.activeOccurrences.length === 0 && Math.random() < 0.25) {
            this.addLog('Dia tranquilo. Nenhuma ocorrência registrada. ☕', 'normal');
            this.saveGame();
            return;
        }

        // Gerar 1 ou 2 ocorrências
        const numToGenerate = Math.floor(Math.random() * 2) + 1;
        const chances = GameData.occurrences.filter(oc => {
            if (this.state.level === 1 && oc.baseDifficulty <= 6) return true;
            if (this.state.level === 2 && oc.baseDifficulty <= 8) return true;
            if (this.state.level >= 3) return true;
            return false;
        });

        for (let i = 0; i < numToGenerate; i++) {
            if (this.state.activeOccurrences.length >= 3) break;
            const occTemplate = chances[Math.floor(Math.random() * chances.length)];
            const loc = GameData.locations[Math.floor(Math.random() * GameData.locations.length)];
            
            // Gerar id único para a ocorrência
            const occId = 'occ_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

            this.state.activeOccurrences.push({
                ...occTemplate,
                id: occId,
                location: loc,
                title: `${occTemplate.type.toUpperCase()} em ${loc}`
            });
        }
        this.saveGame();
    },

    // Recupera energia dos militares ao final do dia
    recoverEnergy: function() {
        this.state.troop.forEach(c => {
            if (c.onLeave) {
                c.energy = 100;
                c.onLeave = false;
            } else {
                c.energy = Math.min(100, (c.energy || 100) + 20);
            }
            c.dayMissions = 0;
        });
    },

    triggerDailyEvent: function() {
        // Visita surpresa do TC Matos
        if (!this.state.tcMatosVisited && this.state.day >= this.state.tcMatosDayTarget) {
            this.state.tcMatosVisited = true;
            const matos = GameData.tcMatosEvent;
            this.state.reputation += matos.repChange;
            this.state.money += matos.moneyChange;
            this.state.moral += matos.moralChange;
            this.addLog(matos.logMsg, 'alert');
            this.saveGame();
            return { text: matos.text, repChange: matos.repChange, moneyChange: matos.moneyChange, isTcMatos: true };
        }

        // 50% chance: evento com nome de um militar da tropa
        const useTroopEvent = Math.random() < 0.5 && this.state.troop && this.state.troop.length > 0;

        let event, eventText;
        if (useTroopEvent) {
            event = GameData.troopEvents[Math.floor(Math.random() * GameData.troopEvents.length)];
            const soldier = this.state.troop[Math.floor(Math.random() * this.state.troop.length)];
            eventText = event.text.replace('{soldier}', soldier.name);
        } else {
            event = GameData.events[Math.floor(Math.random() * GameData.events.length)];
            eventText = event.text;
        }

        this.state.reputation += event.repChange;
        this.state.money += event.moneyChange;

        let moralChange = 0;
        if (event.repChange < 0 || event.moneyChange < 0) {
            moralChange = -2;
            this.state.moral += moralChange;
        } else if (event.repChange > 0) {
            moralChange = 2;
            this.state.moral += moralChange;
        }

        let logText = `[EVENTO] ${eventText}`;
        if (event.repChange !== 0) logText += ` | Reputação: ${event.repChange > 0 ? '+' : ''}${event.repChange}`;
        if (event.moneyChange !== 0) logText += ` | Finanças: R$ ${event.moneyChange > 0 ? '+' : ''}${event.moneyChange}`;
        if (moralChange !== 0) logText += ` | Moral: ${moralChange > 0 ? '+' : ''}${moralChange}`;

        this.addLog(logText, event.repChange < 0 || event.moneyChange < 0 ? 'alert' : 'normal');
        return { ...event, text: eventText };
    },

    // Checa sinergia entre militar e viatura
    checkSynergy: function(charProfile, vehicleId) {
        return GameData.synergies.find(s => s.profileKey === charProfile && s.vehicleId === vehicleId) || null;
    },

    // ─── LOGÍSTICA DE PESSOAL ─────────────────────────────────

    // Retorna o posto do militar: 'TEN', 'SGT' ou 'BC'
    _getRank: function(charName) {
        if (charName.startsWith('TEN')) return 'TEN';
        if (charName.startsWith('SGT') || charName.startsWith('SUB')) return 'SGT';
        return 'BC';
    },

    // Custo diário baseado no perfil (não no posto)
    _getMaintCostForChar: function(char) {
        const profile = GameData.profiles[char.profile];
        return profile ? (profile.maintCost || 15) : 15;
    },

    // Custo único de contratação baseado no posto
    _getHireCost: function(charName) {
        const rank = this._getRank(charName);
        if (rank === 'BC') return 150;
        if (rank === 'SGT') return 250;
        return 400; // TEN
    },

    // Retorna custo diário total da tropa atual
    getDailyMaintenance: function() {
        return (this.state.troop || []).reduce((total, c) => total + this._getMaintCostForChar(c), 0);
    },

    // Contrata um novo militar (adiciona à tropa)
    hireCharacter: function(charId) {
        const char = GameData.characters.find(c => c.id === charId);
        if (!char) return { success: false, text: 'Militar não encontrado.' };
        const cost = this._getHireCost(char.name);
        if (this.state.money < cost) {
            return { success: false, text: `Fundos insuficientes! Contratar ${char.name} custa R$${cost}. Você tem R$${this.state.money.toFixed(0)}.` };
        }
        this.state.money -= cost;
        this.state.troop.push({ ...char, energy: 100, missionCount: 0, dayMissions: 0 });
        this.addLog(`[CONTRATAÇÃO] ${char.name} (${char.profile}) integrado(a) à guarnição. R$-${cost}`, 'normal');
        this.saveGame();
        return { success: true, char, cost };
    },

    // Troca um militar por outro do mesmo posto
    transferAndHire: function(fromIdx, toCharId) {
        const fromChar = this.state.troop[fromIdx];
        if (!fromChar) return { success: false, text: 'Militar não encontrado.' };
        const toChar = GameData.characters.find(c => c.id === toCharId);
        if (!toChar) return { success: false, text: 'Substituto não encontrado.' };
        if (this._getRank(fromChar.name) !== this._getRank(toChar.name)) {
            return { success: false, text: 'Troca só é permitida entre militares do mesmo posto.' };
        }
        const cost = this._getHireCost(toChar.name);
        if (this.state.money < cost) {
            return { success: false, text: `Fundos insuficientes! Custo da troca: R$${cost}.` };
        }
        this.state.money -= cost;
        this.state.troop.splice(fromIdx, 1, { ...toChar, energy: 100, missionCount: 0, dayMissions: 0 });
        this.addLog(`[TRANSFERÊNCIA] ${fromChar.name} saiu → ${toChar.name} (${toChar.profile}) assumiu a vaga. R$-${cost}`, 'normal');
        this.saveGame();
        return { success: true, fromChar, toChar };
    },

    // Nível 3: jogador escolhe o posto do reforço
    claimLevel3Reinforcement: function(rankType) {
        const currentIds = new Set(this.state.troop.map(c => c.id));
        let available = GameData.characters.filter(c => {
            if (currentIds.has(c.id)) return false;
            return this._getRank(c.name) === rankType;
        });
        if (available.length === 0) {
            available = GameData.characters.filter(c => !currentIds.has(c.id));
        }
        if (available.length === 0) {
            return { success: false, text: 'Sem militares disponíveis!' };
        }
        const newChar = { ...available[Math.floor(Math.random() * available.length)], energy: 100, missionCount: 0, dayMissions: 0 };
        this.state.troop.push(newChar);
        this.state.pendingLevel3Choice = false;
        this.addLog(`[NÍVEL 3] ${newChar.name} (${newChar.profile}) se juntou à guarnição!`, 'normal');
        this.saveGame();
        return { success: true, char: newChar };
    },

    resolveOccurrence: function(occId, charIds, vehicleIds) {
        if (!this.state.activeOccurrences) this.state.activeOccurrences = [];
        const occIndex = this.state.activeOccurrences.findIndex(o => o.id === occId);
        const occ = this.state.activeOccurrences[occIndex];

        if (!occ) return null;

        const chars = charIds.map(id => this.state.troop.find(c => c.id === id)).filter(Boolean);
        const vehs = vehicleIds.map(id => this.state.fleet.find(v => v.id === id)).filter(Boolean);

        if (chars.length === 0 || vehs.length === 0) return null;

        let totalSuccessMod = 0;
        let totalChaosMod = 0;
        let isExhausted = false;
        let fatigueMsg = '';

        chars.forEach(c => {
            const profile = GameData.profiles[c.profile];
            if (profile) {
                totalSuccessMod += profile.modifiers.success;
                totalChaosMod += profile.modifiers.chaos;
            }
            totalSuccessMod += (c.progressionBonus || 0);
            const cExhausted = (c.energy || 100) <= 30;
            if (cExhausted) {
                isExhausted = true;
                fatigueMsg += `\n⚠️ [FADIGA] ${c.name} está ESTRESSADO!`;
            }
        });

        if (isExhausted) {
            fatigueMsg += ` Chance de caos dobrada.`;
        }

        // Acumular sinergias
        let synergySuccessBonus = 0;
        let synergyChaosReduction = 0;
        let synergyNotes = [];

        chars.forEach(c => {
            vehs.forEach(v => {
                const synergy = this.checkSynergy(c.profile, v.id);
                if (synergy) {
                    synergySuccessBonus += synergy.successBonus;
                    synergyChaosReduction += synergy.chaosReduction;
                    synergyNotes.push(synergy.desc);
                }
            });
        });

        // Chance de falha das viaturas
        let totalVehFailChance = 0;
        vehs.forEach(v => {
            totalVehFailChance += v.baseFailChance;
        });

        let successChance = 0.6 - (occ.baseDifficulty * 0.05) + totalSuccessMod - (totalVehFailChance * 0.5) + synergySuccessBonus;
        const diffData = GameData.difficulties[this.state.difficulty || 'normal'];
        if (diffData) successChance += diffData.successBonus;
        successChance = Math.max(0.05, Math.min(0.95, successChance));

        let chaosChance = (0.1 + totalChaosMod - synergyChaosReduction) * (isExhausted ? 2 : 1);
        chaosChance = Math.max(0, chaosChance);

        const roll = Math.random();
        const chaosRoll = Math.random();

        let resultType = roll <= successChance ? 'success' : 'fail';
        let isChaos = chaosRoll < chaosChance;

        // Reduzir energia (-25 por missão) e atualizar contadores
        chars.forEach(c => {
            c.energy = Math.max(0, (c.energy || 100) - 25);
            c.missionCount = (c.missionCount || 0) + 1;
            c.dayMissions = (c.dayMissions || 0) + 1;
            this.checkMilitaryProgression(c);
        });

        // Atualizar progresso da meta semanal
        this._updateWeeklyProgress(occ, resultType);

        // Aplicar desgaste a todas as viaturas (3 a 10)
        let wearText = '';
        vehs.forEach(v => {
            const damage = Math.floor(Math.random() * 8) + 3;
            v.condition = Math.max(0, v.condition - damage);
            wearText += `\n[VIATURA] ${v.name} sofreu -${damage}% de condição (Restante: ${v.condition}%)`;
        });

        // Nomes formatados dos militares
        let charNames = chars.map(c => c.name).join(', ');
        const lastCommaIndex = charNames.lastIndexOf(', ');
        if (lastCommaIndex !== -1) {
            charNames = charNames.substring(0, lastCommaIndex) + ' e ' + charNames.substring(lastCommaIndex + 2);
        }

        // Nomes formatados das viaturas
        let vehNames = vehs.map(v => v.name).join(', ');
        const lastVehCommaIndex = vehNames.lastIndexOf(', ');
        if (lastVehCommaIndex !== -1) {
            vehNames = vehNames.substring(0, lastVehCommaIndex) + ' e ' + vehNames.substring(lastVehCommaIndex + 2);
        }

        // Montar narrativa
        let snippetList = isChaos ? GameData.narrativeSnippets.chaos : GameData.narrativeSnippets[resultType];
        if (!snippetList || snippetList.length === 0) snippetList = GameData.narrativeSnippets.success;

        let text = snippetList[Math.floor(Math.random() * snippetList.length)]
            .replace('{character}', charNames)
            .replace('{vehicle}', vehNames)
            .replace('{location}', occ.location);

        let consequences = '';
        if (resultType === 'success') {
            this.state.money += occ.reward;
            this.state.reputation += 3;
            this.state.moral += 2;
            this.state.consecutiveSuccesses = (this.state.consecutiveSuccesses || 0) + 1;
            consequences = `\n[+] R$ ${occ.reward} | [+] 3 Reputação | [+] 2 Moral`;
        } else {
            const penaltyMult = diffData ? diffData.penaltyMult : 1.0;
            const penalty = Math.floor(occ.reward / 2 * penaltyMult);
            this.state.money -= penalty;
            this.state.reputation -= 2;
            this.state.moral -= 3;
            this.state.consecutiveSuccesses = 0;
            consequences = `\n[-] R$ ${penalty} | [-] 2 Reputação | [-] 3 Moral`;
        }

        consequences += wearText;
        chars.forEach(c => {
            consequences += `\n[MILITAR] ${c.name} energia: ${c.energy}%`;
        });

        if (isChaos) {
            this.state.reputation -= 1;
            consequences += `\n[CAOS] [-] 1 Reputação`;
        }

        const synergyNote = synergyNotes.length > 0 ? `\n` + synergyNotes.join('\n') : '';
        const fullLog = `OCORRÊNCIA: ${occ.title}\n${text}${fatigueMsg}${synergyNote}${consequences}`;
        this.addLog(fullLog, resultType === 'fail' ? 'alert' : 'normal');

        // Remover ocorrência do array ativo
        this.state.activeOccurrences.splice(occIndex, 1);
        this.saveGame();

        return { text: fullLog, resultType, isChaos };
    },

    expireOldOccurrences: function() {
        if (!this.state.activeOccurrences) {
            this.state.activeOccurrences = [];
            return;
        }

        const count = this.state.activeOccurrences.length;
        if (count > 0) {
            const penaltyRep = count * 2;
            const penaltyMoral = count * 3;
            
            this.state.reputation -= penaltyRep;
            this.state.moral -= penaltyMoral;
            
            this.addLog(`[NEGLIGÊNCIA] ${count} ocorrência(s) expiraram por falta de atendimento! Reputação: -${penaltyRep} | Moral: -${penaltyMoral}`, 'alert');
            
            this.state.activeOccurrences = [];
            this.saveGame();
        }
    },

    // Oficina do Zé: conserta uma viatura com resultado aleatório
    repairVehicle: function(vehicleId) {
        const veh = this.state.fleet.find(v => v.id === vehicleId);
        if (!veh) return null;

        const cost = 300;
        if (this.state.money < cost) {
            return { success: false, text: `Sem grana! A Oficina do Zé cobra R$ ${cost} e você não tem nem isso. Humilhante.` };
        }

        this.state.money -= cost;

        const outcome = GameData.workshopOutcomes[Math.floor(Math.random() * GameData.workshopOutcomes.length)];
        const before = veh.condition;
        veh.condition = Math.max(0, Math.min(100, veh.condition + outcome.repairAmount));

        const logMsg = `[OFICINA] ${veh.name}: ${before}% → ${veh.condition}% | R$ -${cost} | ${outcome.text}`;
        this.addLog(logMsg, outcome.type === 'fail' ? 'alert' : 'normal');
        this.saveGame();

        return { success: true, outcome, before, after: veh.condition, vehName: veh.name, cost };
    },

    // ─── META SEMANAL ─────────────────────────────────────────

    _updateWeeklyProgress: function(occ, resultType) {
        if (!this.state.weeklyGoal) return;
        const goal = this.state.weeklyGoal;
        if (goal.tag === 'any') {
            this.state.weeklyProgress++;
        } else if (goal.tag === 'noFail') {
            if (resultType === 'success') {
                this.state.weeklyProgress = Math.min(goal.count, this.state.consecutiveSuccesses + 1);
            }
        } else if (occ.tags && occ.tags.includes(goal.tag) && resultType === 'success') {
            this.state.weeklyProgress++;
        }
    },

    evaluateWeeklyGoal: function() {
        if (!this.state.weeklyGoal) return null;
        if ((this.state.day - this.state.weeklyStartDay) < 7) return null;
        const goal = this.state.weeklyGoal;
        const progress = this.state.weeklyProgress || 0;
        const success = progress >= goal.count;
        if (success) {
            this.state.reputation += goal.repReward;
            this.state.money += goal.moneyReward;
            this.addLog(`[META SEMANAL] ✔ "${goal.text}" concluída! +${goal.repReward} rep | R$+${goal.moneyReward}`, 'normal');
        } else {
            this.state.reputation -= 2;
            this.addLog(`[META SEMANAL] ✘ "${goal.text}" não concluída (${progress}/${goal.count}). -2 reputação.`, 'alert');
        }
        const goals = GameData.weeklyGoals;
        this.state.weeklyGoal = { ...goals[Math.floor(Math.random() * goals.length)] };
        this.state.weeklyProgress = 0;
        this.state.weeklyStartDay = this.state.day;
        this.saveGame();
        return { success, goal, progress };
    },

    // ─── PROGRESSÃO MILITAR ───────────────────────────────────

    checkMilitaryProgression: function(char) {
        const milestones = GameData.militaryMilestones;
        const missions = char.missionCount || 0;
        for (let i = milestones.length - 1; i >= 0; i--) {
            if (missions >= milestones[i].missions) {
                const level = i + 1;
                if ((char.progressionLevel || 0) < level) {
                    char.progressionLevel = level;
                    char.progressionTag = milestones[i].tag;
                    char.progressionBonus = milestones[i].successBonus;
                    this.state.pendingProgressionMsg = `🏅 ${char.name} atingiu "${milestones[i].tag}" após ${missions} missões!${milestones[i].successBonus > 0 ? ` (+${milestones[i].successBonus * 100}% sucesso)` : ''}`;
                }
                break;
            }
        }
    },

    // ─── RECUSAR OCORRÊNCIA ───────────────────────────────────

    refuseOccurrence: function(occId) {
        if (!this.state.activeOccurrences) return null;
        const idx = this.state.activeOccurrences.findIndex(o => o.id === occId);
        if (idx === -1) return null;
        const occ = this.state.activeOccurrences[idx];
        this.state.reputation -= 1;
        this.state.moral -= 1;
        this.state.activeOccurrences.splice(idx, 1);
        this.addLog(`[RECUSA] "${occ.title}" recusado. -1 reputação, -1 moral.`, 'alert');
        this.saveGame();
        return occ;
    },

    addLog: function(message, type = "normal") {
        const logEntry = `DIA ${this.state.day}: ${message}`;
        this.state.history.push({ text: logEntry, type: type });
        this.saveGame();
    },

    getReputationTitle: function() {
        for (let level of GameData.reputationLevels) {
            if (this.state.reputation <= level.max) return level.title;
        }
        return GameData.reputationLevels[GameData.reputationLevels.length - 1].title;
    },

    checkLevelUp: function() {
        const oldLevel = this.state.level || 1;
        let newLevel = 1;

        if (this.state.reputation >= 50) {
            newLevel = 3;
        } else if (this.state.reputation >= 20) {
            newLevel = 2;
        } else {
            newLevel = 1;
        }

        if (newLevel > oldLevel) {
            this.state.level = newLevel;
            this.unlockNewResources(newLevel);
        }
    },

    unlockNewResources: function(level) {
        const currentTroopIds = new Set(this.state.troop.map(c => c.id));
        const currentFleetIds = this.state.fleet.map(v => v.id);
        const availableVehs = GameData.vehicles.filter(v => !currentFleetIds.includes(v.id));

        let unlockMsg = `🎖️ [REFORÇO DO COMANDO] O Quartel subiu para o Nível ${level}!`;

        // ── Viatura nova (qualquer nível) ──────────────────────────
        if (availableVehs.length > 0) {
            const newVeh = { ...availableVehs[Math.floor(Math.random() * availableVehs.length)] };
            this.state.fleet.push(newVeh);
            unlockMsg += `\n🚒 Viatura ${newVeh.name} integrada à frota!`;
        }

        // ── Nível 2: +1 militar aleatório (posto aleatório) ────────
        if (level === 2) {
            const available = GameData.characters.filter(c => !currentTroopIds.has(c.id));
            if (available.length > 0) {
                const newChar = { ...available[Math.floor(Math.random() * available.length)], energy: 100, missionCount: 0, dayMissions: 0 };
                this.state.troop.push(newChar);
                unlockMsg += `\n🧑‍🚒 ${newChar.name} (${newChar.profile}) se juntou à guarnição!`;
            }
            this.addLog(unlockMsg, 'normal');
            this.state.pendingUnlockMsg = unlockMsg;
        }

        // ── Nível 3: jogador escolhe o posto do reforço ────────────
        if (level === 3) {
            this.state.pendingLevel3Choice = true;
            unlockMsg += `\n👥 Você pode escolher um reforço no painel de Gestão de Pessoal!`;
            this.addLog(unlockMsg, 'normal');
            this.state.pendingUnlockMsg = unlockMsg;
        }

        this.saveGame();
    },

    checkEndGame: function() {
        if (this.state.reputation >= 100) {
            return { isOver: true, type: 'win', title: 'FINAL LENDÁRIO', desc: 'O 17° BBM virou referência regional. Até o Caminhão Velho sobreviveu. Milagrosamente.' };
        }

        const allVehiclesBroken = this.state.fleet.every(v => v.condition <= 0);

        if (this.state.reputation <= -20 || this.state.moral <= -20 || this.state.money <= -5000 || allVehiclesBroken) {
            let reason = 'O comando perdeu a confiança no quartel.';
            if (allVehiclesBroken) reason = 'Todas as viaturas foram sucateadas.';
            else if (this.state.money <= -5000) reason = 'O quartel faliu completamente.';
            else if (this.state.moral <= -20) reason = 'A moral da tropa colapsou.';

            return { isOver: true, type: 'lose', title: 'INTERVENÇÃO OPERACIONAL', desc: reason };
        }

        return { isOver: false };
    }
};

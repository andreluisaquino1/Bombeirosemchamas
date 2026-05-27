// Controlador principal do jogo

const GameMain = {
    init: function() {
        if (GameEngine.hasSave()) {
            document.getElementById('btn-continue').disabled = false;
        }
    },

    startNewCampaign: function() {
        GameUI.toggleHeader(false);
        GameUI.showScreen('screen-difficulty');
    },

    selectDifficulty: function(diff) {
        const nameInput = document.getElementById('input-campaign-name');
        const campaignName = nameInput ? nameInput.value.trim() : '';
        GameEngine.resetGame(diff);
        GameEngine.state.campaignName = campaignName || `17° BBM — ${GameData.difficulties[diff].label}`;
        GameEngine.saveGame();
        GameUI.showScreen('screen-intro');
        document.getElementById('btn-intro-next').classList.add('hidden');
        GameUI.typeText('intro-text', GameData.introText, () => {
            document.getElementById('btn-intro-next').classList.remove('hidden');
        });
    },

    continueCampaign: function() {
        if (GameEngine.loadGame()) {
            this.enterCampaign();
        }
    },

    revealTroop: function() {
        GameUI.toggleHeader(false);
        const container = document.getElementById('troop-reveal-content');

        let html = '';
        GameEngine.state.troop.forEach(c => {
            html += `<div style="border: 1px dashed var(--text-color); padding: 10px;">
                <h3 style="margin-bottom: 5px;">${c.name}</h3>
                <p><strong>Perfil:</strong> ${c.profile}</p>
                <p style="font-size: 1rem; margin-top: 5px; color: #ccc;">${c.desc}</p>
                <p style="margin-top:4px;"><em>"${c.frase}"</em></p>
            </div>`;
        });
        container.innerHTML = html;

        GameUI.showScreen('screen-troop-reveal');
    },

    enterCampaign: function() {
        GameUI.toggleHeader(true);
        GameUI.updateHeader();
        GameUI.showScreen('screen-campaign');
        this._updateCampaignScreen();
    },

    _updateCampaignScreen: function() {
        // Nome da campanha
        const nameEl = document.getElementById('ui-campaign-name');
        if (nameEl) nameEl.innerText = GameEngine.state.campaignName || '';

        // Meta semanal
        const goalEl = document.getElementById('weekly-goal-display');
        if (goalEl && GameEngine.state.weeklyGoal) {
            const g = GameEngine.state.weeklyGoal;
            const daysLeft = Math.max(0, 7 - (GameEngine.state.day - (GameEngine.state.weeklyStartDay || 1)));
            const prog = GameEngine.state.weeklyProgress || 0;
            const pct = Math.min(100, Math.round(prog / g.count * 100));
            goalEl.innerHTML = `📋 <strong>META:</strong> ${g.text} &nbsp; <span style="color:#f0a500;">${prog}/${g.count}</span> <span style="color:#888;">(${daysLeft} dia(s))</span>`;
        }

        // Banner de escolha nível 3
        const level3Banner = document.getElementById('level3-banner');
        if (level3Banner) {
            if (GameEngine.state.pendingLevel3Choice) level3Banner.classList.remove('hidden');
            else level3Banner.classList.add('hidden');
        }

        // Alertas de viatura
        const alertEl = document.getElementById('fleet-alerts');
        if (alertEl && GameEngine.state.fleet) {
            let html = '';
            GameEngine.state.fleet.forEach(v => {
                if (v.condition <= 0) html += `<div class="alert">⛔ ${v.name} SUCATEADA — leve à oficina!</div>`;
                else if (v.condition <= 30) html += `<div class="alert">⚠️ ${v.name} condição crítica (${v.condition}%)</div>`;
                const fuel = v.fuel !== undefined ? v.fuel : 100;
                if (v.type !== 'Reboque' && fuel <= 20) html += `<div class="alert">🪫 ${v.name} combustível baixo (${fuel}%)</div>`;
            });
            alertEl.innerHTML = html;
        }
    },

    showHistory: function() {
        GameEngine.loadGame();
        GameUI.renderHistory();
        GameUI.showScreen('screen-history');
    },

    returnToMenu: function() {
        GameUI.toggleHeader(false);
        GameUI.showScreen('screen-menu');
        this.init();
    },

    returnToCampaign: function() {
        GameUI.showScreen('screen-campaign');
    },

    openSettings: function() {
        GameUI.toggleHeader(false);
        GameUI.showScreen('screen-settings');
    },

    saveSettings: function() {
        const crt = document.getElementById('config-crt').checked;
        const overlay = document.getElementById('crt-overlay');
        if (crt) overlay.classList.remove('hidden');
        else overlay.classList.add('hidden');
    },

    resetSaveFile: function() {
        if (confirm("Tem certeza que deseja apagar o save? Isso não pode ser desfeito.")) {
            localStorage.removeItem("17bbm_save");
            alert("Save apagado.");
            this.returnToMenu();
            document.getElementById('btn-continue').disabled = true;
        }
    },

    showEndGame: function(endData) {
        GameUI.toggleHeader(false);
        document.getElementById('endgame-title').innerText = endData.title;
        document.getElementById('endgame-title').setAttribute('data-text', endData.title);
        document.getElementById('endgame-desc').innerText = endData.desc;

        document.getElementById('endgame-stats').innerHTML = `
            <p>Dias Sobrevividos: ${GameEngine.state.day}</p>
            <p>Reputação Final: ${GameEngine.state.reputation}</p>
            <p>Moral Final: ${GameEngine.state.moral}</p>
            <p>Dinheiro: R$ ${GameEngine.state.money.toFixed(2)}</p>
        `;

        GameUI.showScreen('screen-endgame');
        localStorage.removeItem("17bbm_save");
        document.getElementById('btn-continue').disabled = true;
    },

    nextDay: function() {
        // 1. Expirar ocorrências do dia anterior
        const expiredCount = GameEngine.state.activeOccurrences ? GameEngine.state.activeOccurrences.length : 0;
        GameEngine.expireOldOccurrences();

        GameEngine.state.day++;
        const maintCost = GameEngine.getDailyMaintenance();
        const vehMaint  = GameEngine.getDailyVehicleMaintenance();
        GameEngine.state.money -= (maintCost + vehMaint);
        GameEngine.addLog(`Dia finalizado. Tropa: R$${maintCost} | Frota: R$${vehMaint} | Total: R$${maintCost + vehMaint}`);

        // Recuperação de energia diária
        GameEngine.recoverEnergy();

        GameEngine.checkLevelUp();

        const event = GameEngine.triggerDailyEvent();
        GameEngine.generateOccurrence();

        GameEngine.saveGame();
        GameUI.updateHeader();
        this._updateCampaignScreen();

        // Destaque do dia
        const activeTroop = (GameEngine.state.troop || []).filter(c => (c.dayMissions || 0) > 0);
        if (activeTroop.length > 0) {
            const hero = activeTroop.reduce((a, b) => (a.dayMissions || 0) >= (b.dayMissions || 0) ? a : b);
            GameEngine.addLog(`🏅 Destaque do dia: ${hero.name} (${hero.dayMissions} missão(ões))`, 'normal');
        }

        // Avaliar meta semanal
        const weeklyResult = GameEngine.evaluateWeeklyGoal();

        const preview = document.getElementById('log-preview');
        preview.innerHTML += `<div>> DIA ${GameEngine.state.day} INICIADO. | Tropa: R$${maintCost} | Frota: R$${vehMaint}</div>`;
        
        if (expiredCount > 0) {
            preview.innerHTML += `<div class="alert">[NEGLIGÊNCIA] ${expiredCount} chamados expiraram! Perda de reputação.</div>`;
        }

        if (event) {
            const isBad = event.repChange < 0 || event.moneyChange < 0;
            preview.innerHTML += `<div class="${isBad ? 'alert' : ''}">[EVENTO] ${event.text}</div>`;
        }

        if (weeklyResult) {
            const cls = weeklyResult.success ? '' : 'alert';
            const icon = weeklyResult.success ? '✔' : '✘';
            preview.innerHTML += `<div class="${cls}">[META SEMANAL] ${icon} ${weeklyResult.goal.text}: ${weeklyResult.progress}/${weeklyResult.goal.count}</div>`;
        }

        if (GameEngine.state.pendingProgressionMsg) {
            preview.innerHTML += `<div>${GameEngine.state.pendingProgressionMsg}</div>`;
            GameEngine.state.pendingProgressionMsg = null;
            GameEngine.saveGame();
        }

        // Listar novas ocorrências geradas
        if (GameEngine.state.activeOccurrences && GameEngine.state.activeOccurrences.length > 0) {
            GameEngine.state.activeOccurrences.forEach(oc => {
                preview.innerHTML += `<div class="alert">🚨 NOVA OCORRÊNCIA: ${oc.title}</div>`;
            });
        }

        preview.scrollTop = preview.scrollHeight;

        // Mostrar alerta visual de desbloqueio
        if (GameEngine.state.pendingUnlockMsg) {
            alert(GameEngine.state.pendingUnlockMsg);
            GameEngine.state.pendingUnlockMsg = null;
            GameEngine.saveGame();
        }

        const endCheck = GameEngine.checkEndGame();
        if (endCheck.isOver) {
            this.showEndGame(endCheck);
        }
    },

    viewQuarter: function() {
        const quarterInfo = document.getElementById('quarter-info');

        // Viaturas
        let html = `<div><h3>🚒 VIATURAS (${GameEngine.state.fleet.length})</h3><ul>`;
        GameEngine.state.fleet.forEach(v => {
            const condClass = v.condition <= 30 ? 'alert' : '';
            const condLabel = v.condition <= 0 ? 'SUCATEADA' : v.condition <= 30 ? 'CRÍTICA' : 'OK';
            html += `<li>${v.name} — ${v.condition}% <span class="${condClass}">[${condLabel}]</span><br><small>${v.desc}</small></li>`;
        });
        html += `</ul></div>`;

        // Militares com energia/fadiga/progressão/folga
        html += `<div style="margin-top:15px;"><h3>🧑‍🚒 MILITARES (${GameEngine.state.troop.length})</h3>`;
        GameEngine.state.troop.forEach((c, idx) => {
            const energy = c.energy !== undefined ? c.energy : 100;
            const fatigueLabel = energy <= 30 ? ' <span class="alert">⚠️ ESTRESSADO</span>' : energy <= 60 ? ' <span style="color:#f0a500;">😓 Cansado</span>' : ' <span style="color:#00ff88;">✅ Descansado</span>';
            const progressTag = c.progressionTag ? ` <span style="color:#f0a500;">🏅 ${c.progressionTag}</span>` : '';
            const leaveTag = c.onLeave ? ` <span style="color:#f0a500;">[FOLGA HOJE]</span>` : '';
            const leaveBtn = c.onLeave
                ? `<button class="btn" style="margin:4px 0 8px 0; padding:2px 8px; font-size:1rem; color:#555; border-color:#555;" disabled>[ FOLGA AGENDADA ]</button>`
                : `<button class="btn" style="margin:4px 0 8px 0; padding:2px 8px; font-size:1rem; color:#f0a500; border-color:#f0a500;" onclick="GameMain.setMilitaryRest(${idx})">[ DAR FOLGA — recupera 100% ]</button>`;
            html += `<div style="border: 1px dashed #444; padding:8px; margin-bottom:6px;">
                <strong>${c.name}</strong> (${c.profile})${progressTag}${leaveTag}<br>
                Energia: ${energy}%${fatigueLabel} &nbsp;|&nbsp; Missões: ${c.missionCount || 0}<br>
                <small>${c.desc}</small><br>
                ${leaveBtn}
            </div>`;
        });
        html += `</div>`;

        quarterInfo.innerHTML = html;
        GameUI.showScreen('screen-quarter');
    },

    viewOccurrences: function() {
        const occInfo = document.getElementById('occurrence-info');
        const form = document.getElementById('dispatch-form');

        if (!GameEngine.state.activeOccurrences) GameEngine.state.activeOccurrences = [];
        const occs = GameEngine.state.activeOccurrences;

        document.getElementById('btn-dispatch').classList.add('hidden');

        if (occs.length === 0) {
            occInfo.innerHTML = `<p>O telefone não tocou. Quartel em paz. ☕</p>
                <button class="btn" style="margin-top:12px;" onclick="GameMain.returnToCampaign(); GameMain.nextDay();">[N] PRÓXIMO DIA →</button>`;
            form.classList.add('hidden');
            this._selectedOccId = null;
        } else {
            let html = `<p class="alert"><strong>🚨 ${occs.length} CHAMADO(S) ATIVO(S)</strong></p>`;
            occs.forEach((occ, idx) => {
                const reqM = occ.minMilitares || 1;
                const reqV = occ.minViaturas || 1;
                html += `<div style="border: 1px dashed var(--text-color); padding: 10px; margin: 8px 0;">
                    <p><strong>${idx + 1}. ${occ.title}</strong></p>
                    <p style="font-size:1.1rem;">Risco: ${occ.risk}/10 | R$ ${occ.reward} | Min: 🧑‍🚒${reqM} 🚒${reqV}</p>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:5px;">
                        <button class="btn" style="margin:0; padding:5px 10px; font-size:1.1rem; flex:1;" onclick="GameMain.selectOccurrenceForDispatch('${occ.id}')">[ ATENDER ]</button>
                        <button class="btn" style="margin:0; padding:5px 10px; font-size:1.1rem; flex:1; color:var(--alert-color); border-color:var(--alert-color);" onclick="GameMain.refuseOccurrence('${occ.id}')">[ RECUSAR (-1 rep) ]</button>
                    </div>
                </div>`;
            });
            occInfo.innerHTML = html;
            form.classList.add('hidden');
            this._selectedOccId = null;
        }

        GameUI.showScreen('screen-occurrence');
    },

    selectOccurrenceForDispatch: function(occId) {
        const occs = GameEngine.state.activeOccurrences || [];
        const occ = occs.find(o => o.id === occId);
        if (!occ) return;

        this._selectedOccId = occId;

        const occInfo = document.getElementById('occurrence-info');
        const form = document.getElementById('dispatch-form');
        const numChars = document.getElementById('num-chars');
        const numVehs = document.getElementById('num-vehs');

        const reqMilitares = occ.minMilitares || 1;
        const reqViaturas = occ.minViaturas || 1;

        occInfo.innerHTML = `
            <p class="alert"><strong>🚨 ${occ.title}</strong></p>
            <p>Nível de Risco: ${occ.risk}/10</p>
            <p>Recompensa Estimada: R$ ${occ.reward}</p>
            <p style="color: #ccc; font-size: 1.2rem; border-top: 1px dashed var(--text-color); padding-top: 5px;">
                Requisitos mínimos: 🧑‍🚒 ${reqMilitares} e 🚒 ${reqViaturas}
            </p>
            <button class="btn" style="margin:5px 0 0 0; padding:5px 10px; font-size:1.1rem; color:#f0a500; border-color:#f0a500;" onclick="GameMain.viewOccurrences()">[ ← VER TODOS OS CHAMADOS ]</button>
        `;

        // Popular opções de quantidade de militares
        numChars.innerHTML = "";
        const maxTroop = GameEngine.state.troop.length;
        for (let i = reqMilitares; i <= maxTroop; i++) {
            numChars.innerHTML += `<option value="${i}">${i}</option>`;
        }

        // Popular opções de quantidade de viaturas
        numVehs.innerHTML = "";
        const maxFleet = GameEngine.state.fleet.length;
        for (let i = reqViaturas; i <= maxFleet; i++) {
            numVehs.innerHTML += `<option value="${i}">${i}</option>`;
        }

        // Configurar selects iniciais
        this.setupDynamicSelectors();

        form.classList.remove('hidden');
        document.getElementById('btn-dispatch').classList.remove('hidden');
    },

    setupDynamicSelectors: function() {
        const container = document.getElementById('dynamic-selectors');
        const numC = parseInt(document.getElementById('num-chars').value) || 1;
        const numV = parseInt(document.getElementById('num-vehs').value) || 1;
        
        container.innerHTML = "";

        // Gerar selects de militares
        for (let i = 0; i < numC; i++) {
            const label = document.createElement("p");
            label.style.margin = "4px 0 2px 0";
            label.style.fontSize = "1.1rem";
            label.innerText = `Militar #${i+1}:`;
            
            const select = document.createElement("select");
            select.id = `sel-char-${i}`;
            select.className = "btn";
            select.style.width = "100%";
            select.style.background = "var(--bg-color)";
            select.style.color = "var(--text-color)";
            select.style.margin = "0";
            select.onchange = () => this._updateSynergyHint();

            GameEngine.state.troop.forEach(c => {
                const energy = c.energy !== undefined ? c.energy : 100;
                const tag = energy <= 30 ? ' ⚠️ ESTRESSADO' : energy <= 60 ? ' 😓 Cansado' : '';
                select.innerHTML += `<option value="${c.id}">${c.name} (${c.profile})${tag} [${energy}% energia]</option>`;
            });

            // Pré-selecionar militar diferente por padrão se possível
            if (i < GameEngine.state.troop.length) {
                select.selectedIndex = i;
            }

            container.appendChild(label);
            container.appendChild(select);
        }

        // Gerar selects de viaturas
        const currentOcc = (GameEngine.state.activeOccurrences || []).find(o => o.id === this._selectedOccId);
        const occTags = currentOcc ? (currentOcc.tags || []) : [];

        for (let i = 0; i < numV; i++) {
            const label = document.createElement("p");
            label.style.margin = "8px 0 2px 0";
            label.style.fontSize = "1.1rem";
            label.innerText = `Viatura #${i+1}:`;

            const select = document.createElement("select");
            select.id = `sel-veh-${i}`;
            select.className = "btn";
            select.style.width = "100%";
            select.style.background = "var(--bg-color)";
            select.style.color = "var(--text-color)";
            select.style.margin = "0";
            select.onchange = () => this._updateSynergyHint();

            GameEngine.state.fleet.forEach(v => {
                const fuel = v.fuel !== undefined ? v.fuel : 100;
                const isSucateada   = v.condition <= 0;
                const isSemCombust  = v.type !== 'Reboque' && fuel <= 0;
                const isTagRestrict = v.restrictToTags && v.restrictToTags.length > 0
                                      && !v.restrictToTags.some(t => occTags.includes(t));
                const isDisabled = isSucateada || isSemCombust || isTagRestrict;

                // Ícone de condição
                const condIcon = isSucateada ? '⛔' : v.condition <= 20 ? '🔴' : v.condition <= 60 ? '⚠️' : '✅';
                // Ícone de combustível (apenas para viaturas motorizadas)
                const fuelText = v.type !== 'Reboque'
                    ? (isSemCombust ? ' 🪫 SEM COMB.' : fuel <= 20 ? ` ⛽${fuel}%` : ` ⛽${fuel}%`)
                    : '';
                const upgradeText = v.upgraded ? ' ⬆' : '';
                // Motivo do bloqueio
                const blockReason = isSucateada ? ' — SUCATEADA'
                    : isSemCombust ? ' — SEM COMBUSTÍVEL'
                    : isTagRestrict ? ' — Apenas ocorrências aquáticas'
                    : '';

                const opt = document.createElement('option');
                opt.value = v.id;
                opt.text = `${condIcon} ${v.name} — ${v.condition}%${fuelText}${upgradeText}${blockReason}`;
                opt.disabled = isDisabled;
                if (isDisabled) opt.style.color = '#555';
                select.appendChild(opt);
            });

            // Pré-selecionar a i-ésima viatura disponível
            let picked = 0;
            for (let j = 0; j < select.options.length; j++) {
                if (!select.options[j].disabled) {
                    if (picked === i) { select.selectedIndex = j; break; }
                    picked++;
                }
            }

            container.appendChild(label);
            container.appendChild(select);
        }

        this._updateSynergyHint();
    },

    _updateSynergyHint: function() {
        const hint = document.getElementById('synergy-hint');
        if (!hint) return;

        const numCharsEl = document.getElementById('num-chars');
        const numVehsEl = document.getElementById('num-vehs');
        if (!numCharsEl || !numVehsEl) return;

        const numC = parseInt(numCharsEl.value) || 1;
        const numV = parseInt(numVehsEl.value) || 1;

        const charIds = [];
        for (let i = 0; i < numC; i++) {
            const el = document.getElementById(`sel-char-${i}`);
            if (el) charIds.push(el.value);
        }

        const vehIds = [];
        for (let i = 0; i < numV; i++) {
            const el = document.getElementById(`sel-veh-${i}`);
            if (el) vehIds.push(el.value);
        }

        // Validar militares duplicados
        const uniqueChars = new Set(charIds);
        if (uniqueChars.size !== charIds.length) {
            hint.innerText = '⚠️ ERRO: Você selecionou o mesmo militar mais de uma vez!';
            hint.style.color = 'var(--alert-color)';
            return;
        }

        // Validar viaturas duplicadas
        const uniqueVehs = new Set(vehIds);
        if (uniqueVehs.size !== vehIds.length) {
            hint.innerText = '⚠️ ERRO: Você selecionou a mesma viatura mais de uma vez!';
            hint.style.color = 'var(--alert-color)';
            return;
        }

        // Calcular e exibir sinergias ativadas
        let synergyTexts = [];
        charIds.forEach(cId => {
            const c = GameEngine.state.troop.find(char => char.id === cId);
            if (c) {
                vehIds.forEach(vId => {
                    const synergy = GameEngine.checkSynergy(c.profile, vId);
                    if (synergy) {
                        synergyTexts.push(synergy.desc);
                    }
                });
            }
        });

        // Bônus por tipo de viatura
        const occ = (GameEngine.state.activeOccurrences || []).find(o => o.id === this._selectedOccId);
        const occTagsHint = occ ? (occ.tags || []) : [];
        vehIds.forEach(vId => {
            const v = GameEngine.state.fleet.find(veh => veh.id === vId);
            if (v) {
                const tb = GameData.vehicleTypeBonuses[v.type];
                if (tb && tb.tags.some(t => occTagsHint.includes(t))) {
                    synergyTexts.push(tb.desc);
                }
            }
        });

        if (synergyTexts.length > 0) {
            hint.innerText = synergyTexts.join('\n');
            hint.style.color = '#00ff88';
        } else {
            hint.innerText = 'Nenhum bônus de combinação ativo no momento.';
            hint.style.color = '#888';
        }
    },

    dispatchTeam: function() {
        if (!this._selectedOccId) {
            alert("Nenhum chamado selecionado!");
            return;
        }

        const numC = parseInt(document.getElementById('num-chars').value) || 1;
        const numV = parseInt(document.getElementById('num-vehs').value) || 1;

        const charIds = [];
        for (let i = 0; i < numC; i++) {
            charIds.push(document.getElementById(`sel-char-${i}`).value);
        }

        const vehIds = [];
        for (let i = 0; i < numV; i++) {
            vehIds.push(document.getElementById(`sel-veh-${i}`).value);
        }

        // Validar duplicidades
        if (new Set(charIds).size !== charIds.length) {
            alert("Erro: Você não pode enviar o mesmo militar mais de uma vez!");
            return;
        }
        if (new Set(vehIds).size !== vehIds.length) {
            alert("Erro: Você não pode enviar a mesma viatura mais de uma vez!");
            return;
        }

        // Validar condição, combustível e restrições de tag
        const occForDispatch = (GameEngine.state.activeOccurrences || []).find(o => o.id === this._selectedOccId);
        const occTagsForDispatch = occForDispatch ? (occForDispatch.tags || []) : [];
        for (const vId of vehIds) {
            const v = GameEngine.state.fleet.find(v => v.id === vId);
            if (!v) continue;
            if (v.condition <= 0) {
                alert(`⛔ "${v.name}" está SUCATEADA e não pode ser despachada. Leve à oficina primeiro.`);
                return;
            }
            const fuel = v.fuel !== undefined ? v.fuel : 100;
            if (v.type !== 'Reboque' && fuel <= 0) {
                alert(`🪫 "${v.name}" está sem combustível. Abasteça na Oficina do Zé.`);
                return;
            }
            if (v.restrictToTags && v.restrictToTags.length > 0) {
                if (!v.restrictToTags.some(t => occTagsForDispatch.includes(t))) {
                    alert(`⛔ "${v.name}" só pode ser usada em ocorrências aquáticas.\nSelecione outra viatura.`);
                    return;
                }
            }
        }

        const result = GameEngine.resolveOccurrence(this._selectedOccId, charIds, vehIds);

        if (result) {
            document.getElementById('dispatch-form').classList.add('hidden');
            document.getElementById('btn-dispatch').classList.add('hidden');
            const occInfo = document.getElementById('occurrence-info');
            occInfo.innerHTML = `
                <h3>RESULTADO DA MISSÃO</h3>
                <p class="${result.resultType === 'fail' ? 'alert' : ''}">${result.text.replace(/\n/g, '<br>')}</p>
                <button class="btn" style="margin:10px 0 0 0;" onclick="GameMain.viewOccurrences()">[ VER OUTROS CHAMADOS ]</button>
            `;
            this._selectedOccId = null;
            GameUI.updateHeader();

            const endCheck = GameEngine.checkEndGame();
            if (endCheck.isOver) {
                setTimeout(() => this.showEndGame(endCheck), 3000);
            }
        }
    },

    // ─── CONFIGURAÇÕES: BOMBEIROS E VIATURAS ──────────────────

    _getSettingsPanel: function() {
        const panel = document.getElementById('settings-subpanel');
        panel.style.display = 'flex';
        panel.innerHTML = '';
        return panel;
    },

    settingsListBombeiros: function() {
        const panel = this._getSettingsPanel();
        let html = '<p style="color:#f0a500; margin-bottom:8px;">BOMBEIROS CADASTRADOS</p>';
        GameData.characters.forEach((c, i) => {
            html += `<div style="border: 1px dashed #555; padding: 8px;">
                <strong>${i + 1}. ${c.name}</strong><br>
                <small>Perfil: ${c.profile}</small><br>
                <small>${c.desc}</small><br>
                <small><em>"${c.frase}"</em></small>
            </div>`;
        });
        panel.innerHTML = html;
    },

    settingsAddBombeiro: function() {
        const panel = this._getSettingsPanel();
        const perfis = Object.keys(GameData.profiles);
        const optsHtml = perfis.map(p => `<option value="${p}">${p}</option>`).join('');
        panel.innerHTML = `
            <p style="color:#f0a500; margin-bottom:8px;">NOVO BOMBEIRO</p>
            <label>Nome:<br><input id="sb-nome" type="text" class="btn" style="width:100%; background:var(--bg-color); color:var(--text-color); margin:4px 0;"></label>
            <label>Perfil:<br><select id="sb-perfil" class="btn" style="width:100%; background:var(--bg-color); color:var(--text-color); margin:4px 0;">${optsHtml}</select></label>
            <label>Frase:<br><input id="sb-frase" type="text" class="btn" style="width:100%; background:var(--bg-color); color:var(--text-color); margin:4px 0;" placeholder='Ex: Confia na gambiarra.'></label>
            <label>Descrição:<br><input id="sb-desc" type="text" class="btn" style="width:100%; background:var(--bg-color); color:var(--text-color); margin:4px 0;" placeholder='Ex: Sempre tem uma fita isolante no bolso.'></label>
            <button class="btn" style="margin:8px 0 0 0;" onclick="GameMain._confirmAddBombeiro()">[ SALVAR ]</button>
        `;
    },

    _confirmAddBombeiro: function() {
        const nome = document.getElementById('sb-nome').value.trim();
        const perfil = document.getElementById('sb-perfil').value;
        const frase = document.getElementById('sb-frase').value.trim();
        const desc = document.getElementById('sb-desc').value.trim();
        if (!nome) { alert('Nome é obrigatório.'); return; }
        GameData.characters.push({
            id: 'custom_' + Date.now(),
            name: nome,
            profile: perfil,
            desc: desc || '—',
            frase: frase || '—'
        });
        document.getElementById('settings-subpanel').innerHTML = '<p style="color:#00ff88;">✔ Bombeiro adicionado com sucesso!</p>';
    },

    settingsEditBombeiro: function() {
        const panel = this._getSettingsPanel();
        let html = '<p style="color:#f0a500; margin-bottom:8px;">SELECIONE O BOMBEIRO PARA EDITAR</p>';
        GameData.characters.forEach((c, i) => {
            html += `<button class="btn" style="margin:4px 0; text-align:left;" onclick="GameMain._settingsEditBombeiroForm(${i})">${i + 1}. ${c.name} (${c.profile})</button>`;
        });
        panel.innerHTML = html;
    },

    _settingsEditBombeiroForm: function(idx) {
        const c = GameData.characters[idx];
        if (!c) return;
        const panel = this._getSettingsPanel();
        panel.innerHTML = `
            <p style="color:#f0a500; margin-bottom:8px;">EDITANDO: ${c.name}</p>
            <label>Novo nome:<br><input id="se-nome" type="text" class="btn" value="${c.name}" style="width:100%; background:var(--bg-color); color:var(--text-color); margin:4px 0;"></label>
            <label>Nova frase:<br><input id="se-frase" type="text" class="btn" value="${c.frase}" style="width:100%; background:var(--bg-color); color:var(--text-color); margin:4px 0;"></label>
            <button class="btn" style="margin:8px 0 0 0;" onclick="GameMain._confirmEditBombeiro(${idx})">[ SALVAR ]</button>
            <button class="btn" style="margin:4px 0 0 0; color:#888; border-color:#888;" onclick="GameMain.settingsEditBombeiro()">[ ← VOLTAR ]</button>
        `;
    },

    _confirmEditBombeiro: function(idx) {
        const c = GameData.characters[idx];
        if (!c) return;
        const nome = document.getElementById('se-nome').value.trim();
        const frase = document.getElementById('se-frase').value.trim();
        if (nome) c.name = nome;
        if (frase) c.frase = frase;
        document.getElementById('settings-subpanel').innerHTML = '<p style="color:#00ff88;">✔ Bombeiro atualizado!</p>';
    },

    settingsRemoveBombeiro: function() {
        const panel = this._getSettingsPanel();
        let html = '<p style="color:var(--alert-color); margin-bottom:8px;">SELECIONE O BOMBEIRO PARA REMOVER</p>';
        GameData.characters.forEach((c, i) => {
            html += `<button class="btn" style="margin:4px 0; text-align:left; color:var(--alert-color); border-color:var(--alert-color);" onclick="GameMain._confirmRemoveBombeiro(${i})">${i + 1}. ${c.name} (${c.profile})</button>`;
        });
        panel.innerHTML = html;
    },

    _confirmRemoveBombeiro: function(idx) {
        const c = GameData.characters[idx];
        if (!c) return;
        if (confirm(`Remover "${c.name}"? Esta ação não pode ser desfeita.`)) {
            GameData.characters.splice(idx, 1);
            document.getElementById('settings-subpanel').innerHTML = '<p style="color:#00ff88;">✔ Bombeiro removido.</p>';
        }
    },

    settingsListViaturas: function() {
        const panel = this._getSettingsPanel();
        let html = '<p style="color:#f0a500; margin-bottom:8px;">VIATURAS CADASTRADAS</p>';
        GameData.vehicles.forEach((v, i) => {
            html += `<div style="border: 1px dashed #555; padding: 8px;">
                <strong>${i + 1}. ${v.name}</strong> [${v.type}]<br>
                <small>Condição: ${v.condition}% | Falha base: ${(v.baseFailChance * 100).toFixed(0)}%</small><br>
                <small>${v.desc}</small>
            </div>`;
        });
        panel.innerHTML = html;
    },

    settingsAddViatura: function() {
        const tipos = ['Caminhão', 'Resgate', 'Administrativo', 'Apoio', 'Aquático', 'Reboque'];
        const tipoOpts = tipos.map(t => `<option value="${t}">${t}</option>`).join('');
        const panel = this._getSettingsPanel();
        panel.innerHTML = `
            <p style="color:#f0a500; margin-bottom:8px;">NOVA VIATURA</p>
            <label>Nome:<br><input id="sv-nome" type="text" class="btn" style="width:100%; background:var(--bg-color); color:var(--text-color); margin:4px 0;"></label>
            <label>Tipo:<br><select id="sv-tipo" class="btn" style="width:100%; background:var(--bg-color); color:var(--text-color); margin:4px 0;">${tipoOpts}</select></label>
            <label>Descrição:<br><input id="sv-desc" type="text" class="btn" style="width:100%; background:var(--bg-color); color:var(--text-color); margin:4px 0;"></label>
            <label>Chance de Falha (0–100%):<br><input id="sv-falha" type="number" class="btn" min="0" max="100" value="10" style="width:100%; background:var(--bg-color); color:var(--text-color); margin:4px 0;"></label>
            <button class="btn" style="margin:8px 0 0 0;" onclick="GameMain._confirmAddViatura()">[ SALVAR ]</button>
        `;
    },

    _confirmAddViatura: function() {
        const nome = document.getElementById('sv-nome').value.trim();
        const tipo = document.getElementById('sv-tipo').value;
        const desc = document.getElementById('sv-desc').value.trim();
        const falha = parseInt(document.getElementById('sv-falha').value) || 10;
        if (!nome) { alert('Nome é obrigatório.'); return; }
        GameData.vehicles.push({
            id: 'cv_' + Date.now(),
            name: nome,
            desc: desc || '—',
            condition: 100,
            fuel: 100,
            baseFailChance: Math.min(1, Math.max(0, falha / 100)),
            type: tipo
        });
        document.getElementById('settings-subpanel').innerHTML = '<p style="color:#00ff88;">✔ Viatura adicionada com sucesso!</p>';
    },

    refuseOccurrence: function(occId) {
        if (!confirm('Recusar este chamado? -1 reputação e -1 moral.')) return;
        GameEngine.refuseOccurrence(occId);
        GameUI.updateHeader();
        this.viewOccurrences();
    },

    setMilitaryRest: function(idx) {
        const c = GameEngine.state.troop[idx];
        if (!c) return;
        c.onLeave = true;
        GameEngine.saveGame();
        this.viewQuarter();
    },

    // ─── GESTÃO DE PESSOAL ────────────────────────────────────

    openPersonnel: function() {
        this._renderPersonnelScreen();
        GameUI.showScreen('screen-personnel');
    },

    claimLevel3Reinforcement: function(rankType) {
        const result = GameEngine.claimLevel3Reinforcement(rankType);
        if (!result.success) { alert(result.text); return; }
        GameUI.updateHeader();
        this._updateCampaignScreen();
        const preview = document.getElementById('log-preview');
        if (preview) preview.innerHTML += `<div>[REFORÇO] 🎖️ ${result.char.name} (${result.char.profile}) se juntou à guarnição!</div>`;
    },

    _renderPersonnelScreen: function(activeTransferIdx = null) {
        const content = document.getElementById('personnel-content');
        const troop = GameEngine.state.troop || [];
        const troopIds = new Set(troop.map(c => c.id));
        const allAvailable = GameData.characters.filter(c => !troopIds.has(c.id));
        const dailyTotal = GameEngine.getDailyMaintenance();

        const rankLabel = r => r === 'TEN' ? 'TENENTES' : r === 'SGT' ? 'SARGENTOS / SUBTENENTES' : 'BOMBEIROS COMBATENTES';

        let html = `<p style="color:#f0a500; margin-bottom:4px;">👥 TROPA ATUAL — ${troop.length} militar(es)</p>
            <p style="font-size:1rem; margin-bottom:8px; color:#aaa;">Manutenção total: <strong style="color:#f0a500;">R$ ${dailyTotal}/dia</strong></p>`;

        // Agrupa por posto para exibição
        const byRank = { TEN: [], SGT: [], BC: [] };
        troop.forEach((c, idx) => byRank[GameEngine._getRank(c.name)].push({ c, idx }));

        ['TEN', 'SGT', 'BC'].forEach(rank => {
            if (byRank[rank].length === 0) return;
            html += `<p style="color:#aaa; font-size:0.95rem; margin: 8px 0 4px 0; border-bottom:1px dotted #444; padding-bottom:2px;">${rankLabel(rank)}</p>`;

            byRank[rank].forEach(({ c, idx }) => {
                const maint = GameEngine._getMaintCostForChar(c);
                const energy = c.energy !== undefined ? c.energy : 100;
                const fatigue = energy <= 30 ? ' ⚠️' : energy <= 60 ? ' 😓' : '';
                // Candidatos para troca: mesmo posto, fora da tropa
                const sameRankAvail = allAvailable.filter(a => GameEngine._getRank(a.name) === rank);

                if (activeTransferIdx === idx) {
                    // Modo seleção de troca
                    html += `<div style="border:2px solid #f0a500; padding:8px; margin-bottom:6px;">
                        <p><strong>${c.name}</strong> <span style="color:#f0a500;">← TROCANDO</span></p>
                        <p style="font-size:1rem; margin-bottom:6px; color:#ccc;">Selecione o substituto (mesmo posto):</p>`;
                    if (sameRankAvail.length === 0) {
                        html += `<p style="color:#888; font-size:1rem;">Nenhum ${rankLabel(rank).toLowerCase()} disponível para troca.</p>`;
                    } else {
                        sameRankAvail.forEach(a => {
                            const hireCost = GameEngine._getHireCost(a.name);
                            const aMaint = GameEngine._getMaintCostForChar(a);
                            const canAfford = GameEngine.state.money >= hireCost;
                            const col = canAfford ? '#00ff88' : '#555';
                            html += `<div style="border:1px dashed #555; padding:6px; margin-bottom:4px;">
                                <strong>${a.name}</strong> (${a.profile}) — R$${aMaint}/dia mant.<br>
                                <small style="color:#ccc;">${a.desc}</small><br>
                                <small style="color:#f0a500;">Custo da troca: R$${hireCost}</small><br>
                                <button class="btn" style="margin:4px 0 0 0; padding:3px 8px; font-size:1rem; color:${col}; border-color:${col};" ${canAfford ? '' : 'disabled'} onclick="GameMain._confirmTransfer(${idx}, '${a.id}')">[ CONFIRMAR TROCA ]</button>
                            </div>`;
                        });
                    }
                    html += `<button class="btn" style="margin:6px 0 0 0; padding:3px 8px; font-size:1rem; color:#888; border-color:#888;" onclick="GameMain._renderPersonnelScreen()">[ CANCELAR ]</button>
                    </div>`;
                } else {
                    const hasCandidates = sameRankAvail.length > 0;
                    const col = hasCandidates ? '#f0a500' : '#555';
                    const dis = hasCandidates ? '' : 'disabled';
                    const title = hasCandidates ? '' : `title="Nenhum ${rankLabel(rank).toLowerCase()} disponível"`;
                    html += `<div style="border:1px dashed #555; padding:8px; margin-bottom:6px;">
                        <strong>${c.name}</strong> <span style="color:#aaa;">(${c.profile})</span>${fatigue} — <span style="color:#f0a500;">R$${maint}/dia</span><br>
                        <small style="color:#ccc;">${c.desc}</small><br>
                        <button class="btn" style="margin:4px 0 0 0; padding:3px 8px; font-size:1rem; color:${col}; border-color:${col};" ${dis} ${title} onclick="GameMain._renderPersonnelScreen(${idx})">[ TROCAR ]</button>
                    </div>`;
                }
            });
        });

        // ── Contratar Novo ────────────────────────────────────────
        html += `<div style="border-top:1px dashed var(--text-color); padding-top:12px; margin-top:8px;">
            <p style="color:#f0a500; margin-bottom:4px;">📋 CONTRATAR NOVO MILITAR</p>
            <p style="font-size:0.95rem; color:#888; margin-bottom:8px;">Adiciona à tropa sem remover ninguém (aumenta custo diário).</p>`;

        if (allAvailable.length === 0) {
            html += `<p style="color:#888;">Todos os militares já estão na tropa.</p>`;
        } else {
            allAvailable.forEach(c => {
                const cost = GameEngine._getHireCost(c.name);
                const maint = GameEngine._getMaintCostForChar(c);
                const rank = GameEngine._getRank(c.name);
                const canAfford = GameEngine.state.money >= cost;
                const col = canAfford ? '#00ff88' : '#555';
                html += `<div style="border:1px dashed #555; padding:8px; margin-bottom:6px;">
                    <strong>${c.name}</strong> <span style="color:#aaa;">(${c.profile}) [${rank}]</span><br>
                    <small style="color:#ccc;">${c.desc}</small><br>
                    <small><em>"${c.frase}"</em></small><br>
                    <small style="color:#f0a500;">Contratação: R$${cost} | Manutenção: R$${maint}/dia</small><br>
                    <button class="btn" style="margin:4px 0 0 0; padding:3px 8px; font-size:1rem; color:${col}; border-color:${col};" ${canAfford ? '' : 'disabled'} onclick="GameMain._hire('${c.id}')">[ CONTRATAR ]</button>
                </div>`;
            });
        }
        html += `</div>`;
        content.innerHTML = html;
    },

    _hire: function(charId) {
        const result = GameEngine.hireCharacter(charId);
        if (!result.success) { alert(result.text); return; }
        GameUI.updateHeader();
        const preview = document.getElementById('log-preview');
        if (preview) preview.innerHTML += `<div>[CONTRATAÇÃO] ${result.char.name} integrado(a). R$-${result.cost}</div>`;
        this._renderPersonnelScreen();
    },

    _confirmTransfer: function(fromIdx, toCharId) {
        const fromChar = GameEngine.state.troop[fromIdx];
        const toChar = GameData.characters.find(c => c.id === toCharId);
        if (!fromChar || !toChar) return;
        const cost = GameEngine._getHireCost(toChar.name);
        if (!confirm(`Trocar ${fromChar.name} por ${toChar.name}?\nCusto: R$${cost}`)) return;
        const result = GameEngine.transferAndHire(fromIdx, toCharId);
        if (!result.success) { alert(result.text); return; }
        GameUI.updateHeader();
        this._renderPersonnelScreen();
    },

    // ─── OFICINA DO ZÉ ────────────────────────────────────────
    openWorkshop: function() {
        document.getElementById('workshop-info').innerHTML = `
            <p>🔧 A <strong>Oficina do Zé</strong> atende 24h. Os resultados... variam.</p>
            <p style="color:#f0a500; font-size:1rem;">Consertar: R$300 | Abastecer: R$1/% | Melhorar: R$600 (permanente, uma vez)</p>
        `;
        document.getElementById('workshop-result').innerHTML = '';
        this._refreshWorkshopSelect();
        GameUI.showScreen('screen-workshop');
    },

    _refreshWorkshopSelect: function() {
        const sel = document.getElementById('sel-veh-workshop');
        const prevId = sel.value;
        sel.innerHTML = '';
        GameEngine.state.fleet.forEach(v => {
            const condIcon = v.condition <= 0 ? '⛔' : v.condition <= 20 ? '🔴' : v.condition <= 60 ? '⚠️' : '✅';
            const fuel = v.fuel !== undefined ? v.fuel : 100;
            const fuelText = v.type !== 'Reboque' ? ` ⛽${fuel}%` : '';
            const upgradeText = v.upgraded ? ' ⬆' : '';
            sel.innerHTML += `<option value="${v.id}">${condIcon} ${v.name} — ${v.condition}%${fuelText}${upgradeText}</option>`;
        });
        // Manter a viatura selecionada anteriormente se possível
        if (prevId) {
            const match = Array.from(sel.options).find(o => o.value === prevId);
            if (match) sel.value = prevId;
        }
        this._updateWorkshopActions();
    },

    _updateWorkshopActions: function() {
        const actions = document.getElementById('workshop-actions');
        const vehId   = document.getElementById('sel-veh-workshop').value;
        const veh     = GameEngine.state.fleet.find(v => v.id === vehId);
        if (!veh || !actions) return;

        const money      = GameEngine.state.money;
        const fuel       = veh.fuel !== undefined ? veh.fuel : 100;
        const fuelNeeded = 100 - fuel;
        const refuelCost = fuelNeeded; // R$1 por %

        const canRepair  = money >= 300;
        const canRefuel  = veh.type !== 'Reboque' && fuelNeeded > 0 && money >= refuelCost;
        const fullTank   = veh.type === 'Reboque' || fuelNeeded === 0;
        const canUpgrade = !veh.upgraded && veh.condition >= 50 && money >= 600;

        const btn = (label, ok, fn, tip='') =>
            `<button class="btn" style="margin:0; flex-shrink:0; ${ok ? '' : 'color:#555; border-color:#555;'}" ${ok ? '' : 'disabled'} title="${tip}" onclick="${fn}">${label}</button>`;

        const refuelLabel = fullTank
            ? '[ ⛽ ABASTECER — TANQUE CHEIO ]'
            : `[ ⛽ ABASTECER +${fuelNeeded}% — R$${refuelCost} ]`;
        const upgradeLabel = veh.upgraded
            ? '[ ⬆ MELHORAR — JÁ REALIZADA ]'
            : `[ ⬆ MELHORAR VIATURA — R$600 ]`;
        const upgradeTip = veh.upgraded ? 'Melhoria já feita' : veh.condition < 50 ? 'Precisa 50%+ condição' : '';

        actions.innerHTML =
            btn('[ 🔧 CONSERTAR — R$300 ]', canRepair, 'GameMain.doRepair()') +
            btn(refuelLabel,                 canRefuel && !fullTank, 'GameMain.doRefuel()') +
            btn(upgradeLabel,                canUpgrade, 'GameMain.doUpgrade()', upgradeTip);
    },

    doRepair: function() {
        const vehId = document.getElementById('sel-veh-workshop').value;
        const result = GameEngine.repairVehicle(vehId);
        const resultDiv = document.getElementById('workshop-result');
        if (!result.success) { resultDiv.innerHTML = `<p class="alert">${result.text}</p>`; return; }
        const color = result.outcome.type === 'fail' ? 'var(--alert-color)' : result.outcome.type === 'chaos' ? '#f0a500' : '#00ff88';
        resultDiv.innerHTML = `
            <p style="color:${color};">${result.outcome.text}</p>
            <p>${result.vehName}: ${result.before}% → <strong>${result.after}%</strong> | R$-${result.cost}</p>
        `;
        GameUI.updateHeader();
        this._refreshWorkshopSelect();
    },

    doRefuel: function() {
        const vehId = document.getElementById('sel-veh-workshop').value;
        const result = GameEngine.refuelVehicle(vehId);
        const resultDiv = document.getElementById('workshop-result');
        if (!result.success) { resultDiv.innerHTML = `<p class="alert">${result.text}</p>`; return; }
        resultDiv.innerHTML = `<p style="color:#00ff88;">⛽ ${result.vehName} abastecida (+${result.needed}%). R$-${result.cost}</p>`;
        GameUI.updateHeader();
        this._refreshWorkshopSelect();
    },

    doUpgrade: function() {
        const vehId = document.getElementById('sel-veh-workshop').value;
        const result = GameEngine.upgradeVehicle(vehId);
        const resultDiv = document.getElementById('workshop-result');
        if (!result.success) { resultDiv.innerHTML = `<p class="alert">${result.text}</p>`; return; }
        resultDiv.innerHTML = `
            <p style="color:#00ff88;">⬆ ${result.vehName} melhorada! Chance de falha: ${(result.oldChance*100).toFixed(0)}% → ${(result.newChance*100).toFixed(0)}%</p>
            <p>R$-${result.cost} | Melhoria permanente aplicada.</p>
        `;
        GameUI.updateHeader();
        this._refreshWorkshopSelect();
    }
};

// Iniciar ao carregar a página
window.onload = () => {
    GameMain.init();
    GameMain._initKeyboardShortcuts();
};

// ─── ATALHOS DE TECLADO ───────────────────────────────────────────────────────
GameMain._initKeyboardShortcuts = function() {
    document.addEventListener('keydown', function(e) {
        // Ignorar se um campo de texto estiver em foco
        const tag = document.activeElement ? document.activeElement.tagName : '';
        if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

        const activeScreen = document.querySelector('.screen.active');
        if (!activeScreen) return;
        const screenId = activeScreen.id;
        const key = e.key;

        if (screenId === 'screen-menu') {
            if (key === '1') { e.preventDefault(); GameMain.startNewCampaign(); }
            else if (key === '2') { const btn = document.getElementById('btn-continue'); if (btn && !btn.disabled) { e.preventDefault(); GameMain.continueCampaign(); } }
            else if (key === '3') { e.preventDefault(); GameMain.showHistory(); }
            else if (key === '4') { e.preventDefault(); GameMain.openSettings(); }

        } else if (screenId === 'screen-campaign') {
            if (key === 'v' || key === 'V') { e.preventDefault(); GameMain.viewQuarter(); }
            else if (key === 'o' || key === 'O') { e.preventDefault(); GameMain.viewOccurrences(); }
            else if (key === 'w' || key === 'W') { e.preventDefault(); GameMain.openWorkshop(); }
            else if (key === 'p' || key === 'P') { e.preventDefault(); GameMain.openPersonnel(); }
            else if (key === 'n' || key === 'N') { e.preventDefault(); GameMain.nextDay(); }

        } else if (screenId === 'screen-occurrence') {
            // [N] próximo dia só se não houver chamado em aberto
            if (key === 'n' || key === 'N') {
                const occs = GameEngine.state.activeOccurrences || [];
                if (occs.length === 0) { e.preventDefault(); GameMain.returnToCampaign(); GameMain.nextDay(); }
            } else if (key === 'Escape') { e.preventDefault(); GameMain.returnToCampaign(); }

        } else if (
            screenId === 'screen-quarter' ||
            screenId === 'screen-workshop' ||
            screenId === 'screen-personnel'
        ) {
            if (key === 'Escape') { e.preventDefault(); GameMain.returnToCampaign(); }

        } else if (screenId === 'screen-history' || screenId === 'screen-settings') {
            if (key === 'Escape') { e.preventDefault(); GameMain.returnToMenu(); }
        }
    });
};

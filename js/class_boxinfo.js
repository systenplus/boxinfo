/**
 * BoxInfo 2.2 - Caixa de Informações
 * @author Rodrigo Rodrigues ( Fundador - Systen Plus )
 */
class BoxInfo {
    constructor(boxId, txtId, inpId, botId) {
        // Cache dos elementos principais
        this.els = {
            box: document.getElementById(boxId),
            txt: document.getElementById(txtId),
            inp: document.getElementById(inpId),
            bot: document.getElementById(botId),
            tit_txt: document.getElementById('box_info_titulo'),
            bot_fechar: document.querySelector('.box_info_close')
        };
        this.on_key = true;
        this.resul = [];
        this.cfg_cache = {}; // Guarda as configurações do modal aberto
        
        document.addEventListener('keyup', (e) => this._handleKeyUp(e));

        if (this.els.bot_fechar) {
            this.els.bot_fechar.addEventListener('click', () => this.fechar());
        }
    }
    
    abrir(config) {
        this.fechar();

        let cfg = this._normalizarConfig(config);
        this.cfg_cache = cfg;
        this.resul = [];

        this._titulo(cfg.tit);
        this._botFechar(cfg.fechar);

        this.els.txt.innerHTML = '';

        if (cfg.txt) { this.els.txt.innerHTML = cfg.txt; }
        if (cfg.cop) {
            this.els.txt.appendChild(this._criarElementoCopia(cfg.cop));
        }
        if (cfg.cod) {
            this.els.txt.appendChild(this._criarElementoCodigo(cfg.cod));
        }
        this._renderInputs(cfg.inp);
        this._renderBotoes(cfg.bot, cfg.funMain);

        this.els.box.style.display = 'flex';
        
        const inp_main = this.els.inp.querySelector('.box_info_inp');
        const bot_main = document.getElementById('bot_bf_1');
        
        if (inp_main && inp_main.type !== 'button') {
            inp_main.focus();
            
            if( inp_main.tagName != 'SELECT' ) inp_main.select();
        } else if (bot_main) bot_main.focus();

        this._executarLoad(cfg);
        return true;
    }

    _executarLoad(cfg) {
        if (!cfg || typeof cfg.load !== 'function') return;
        const ctx = {
            box: this.els.box,
            txt: this.els.txt,
            inp: this.els.inp,
            bot: this.els.bot,
            boxInfo: this
        };
        try {
            const r = cfg.load(ctx);

            if (r && typeof r.catch === 'function') {
                r.catch((e) => console.error('BoxInfo load():', e));
            }
        } catch (e) {
            console.error('BoxInfo load():', e);
        }
    }

    fechar() {
        this.els.box.style.display = 'none';
        this.els.txt.innerHTML = '';
        this.els.inp.innerHTML = '';
        this.els.bot.innerHTML = '';
        this.cfg_cache = {};

        this._titulo('Caixa de Informações');
        this._botFechar(true);
    }

    resetar() {
        this.fechar();
        this.resul = [];
    }

    /** Valida e coleta dados dos inputs, acionando a função de callback. */
    executar(rgx = false, exe = true) {
        const inputs = Array.from(this.els.inp.querySelectorAll('.box_info_inp, .box_info_sel'));
        // Preserve o callback antes de fechar: fechar() limpa cfg_cache.
        const funMain = this.cfg_cache.funMain;
        this.resul = [];

        for (let input of inputs) {
            const isCheck = input.type === 'checkbox' || input.type === 'radio';
            let valor = isCheck ? (input.checked ? input.value : '') : input.value;
            
            if (input.tagName === 'SELECT') {
                valor = input.options[input.selectedIndex]?.value || '';
            } else {
                valor = isCheck ? (input.checked ? input.value : '') : input.value;
            }
            // Validação de Regex
            if (rgx && input.dataset.regex && !isCheck) {
                const regx = new RegExp(input.dataset.regex, 'g');

                if (valor.trim().length > 0) {
                    if (regx.test(valor)) {
                        this.resul.push(valor);
                    } else {
                        return this._falhaValidfun(input);
                    }
                } else if (input.placeholder && input.placeholder !== '*') {
                    this.resul.push(input.placeholder);
                } else {
                    return this._falhaValidfun(input);
                }
            } else {
                // Sem regex
                if (valor.trim().length > 0 && valor !== 'false') {
                    this.resul.push(valor);
                } else if (!isCheck && input.placeholder && input.placeholder !== '*') {
                    this.resul.push(input.placeholder);
                } else if (isCheck) {
                    this.resul.push(valor);
                } else {
                    return this._falhaValidfun(input);
                }
            }
        }
        this.fechar();
        
        if (exe && typeof funMain === 'function') {
            return funMain(this.resul);
        }
        return true;
    }

    _titulo(titulo) {
        if (this.els.tit_txt && titulo) {
            this.els.tit_txt.textContent = titulo;
        } else if (this.els.tit_txt) {
            this.els.tit_txt.textContent = 'Caixa de Informações'; // Padrão
        }
    }

    _botFechar(exibir = true) {
        if (this.els.bot_fechar) {
            this.els.bot_fechar.style.display = exibir ? 'block' : 'none';
        }
    }

    _renderInputs(inpts) {
        this.els.inp.innerHTML = ''; // Limpa área

        if (!inpts || inpts.length === 0) return;
        inpts.forEach((inpData) => {
            const inp = this._parseLegacyInputs(inpData);
            
            if (!inp) return;
            const span = document.createElement('span');
            span.style.cssText = 'padding:5px; display:inline-block; width: 100%; box-sizing: border-box; position: relative;';

            if (inp.label) {
                const label = document.createElement('label');
                if (inp.htmlLabel === true) {
                    // Apenas chamadas internas e declaradas podem fornecer HTML.
                    // Valores digitados pelo usuário continuam sempre como texto.
                    label.innerHTML = inp.label;
                } else {
                    label.textContent = inp.label;
                }
                label.style.display = 'block';
                label.style.marginBottom = '5px';
                span.appendChild(label);

                if (inp.info !== undefined && inp.info !== null && inp.info !== '') {
                    const botInfo = document.createElement('button');
                    botInfo.type = 'button';
                    botInfo.className = 'info box_info_info';
                    botInfo.setAttribute('aria-label', 'Mais informações');
                    botInfo.textContent = 'i';
                    botInfo.addEventListener('click', (e) => {
                        e.preventDefault();
                        if (typeof window.info === 'function') window.info(inp.info);
                    });
                    label.appendChild(botInfo);
                }
            }
            let el;

            switch (inp.tipo) {
                case 'text':
                case 'password':
                case 'date':
                case 'time':
                case 'number':
                    el = document.createElement('input');
                    el.type = inp.tipo;
                    el.className = `box_info_inp box_info_tex ${inp.tipo === 'number' ? 'box_info_number' : ''}`;
                    if (inp.valor) el.value = inp.valor;
                    if (inp.placeholder) el.placeholder = inp.placeholder;
                    if (inp.id) el.id = inp.id;
                    if (inp.style) el.style.cssText = inp.style;
                    if (inp.min) el.min = inp.min;
                    if (inp.max) el.max = inp.max;
                    if (inp.onkeyup){
                        el.addEventListener('keyup', (e) => {
                            const valorDigitado = e.target.value.trim();
                            const caixaResultados = e.target.parentElement.querySelector('.box_info_busca');
                            
                            if (valorDigitado.length > 0) {
                                if (caixaResultados) caixaResultados.style.display = 'block';
                                inp.onkeyup(e);
                            } else {
                                if (caixaResultados) {
                                    caixaResultados.style.display = 'none';
                                    caixaResultados.innerHTML = '';
                                }
                            }
                        });
                    }
                    break;
                case 'checkbox':
                    el = document.createElement('input');
                    el.type = 'checkbox';
                    el.className = 'box_info_inp box_info_chk';
                    el.value = inp.valor !== undefined ? inp.valor : 'true';

                    if (inp.id) el.id = inp.id;
                    if (inp.checked) el.checked = true;
                    break;
                case 'select':
                    el = document.createElement('select');
                    el.className = 'box_info_inp box_info_sel';
                    inp.opcoes.forEach((opt, idx) => {
                        const option = document.createElement('option');
                        option.value = opt.val;
                        option.textContent = opt.txt;
                        if (idx === 0) option.selected = true;
                        el.appendChild(option);
                    });
                    if (inp.onChange) el.addEventListener('change', inp.onChange);
                    break;
                case 'button':
                    const container = document.createElement('div');
                    container.style.display = 'flex';
                    container.style.flexWrap = 'wrap';
                    container.style.justifyContent = 'center';
                    container.style.gap = '10px';

                    inp.opcoes.forEach(opt => {
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = 'box_info_inp box_info_sel_bot';
                        btn.innerHTML = opt.txt;
                        btn.onclick = (e) => {
                            e.preventDefault();
                            if (typeof opt.fun === 'function') opt.fun();
                            else this.executar(true);
                        };
                        container.appendChild(btn);
                    });
                    el = container;
                    break;
                case 'image':
                    el = document.createElement('div');
                    const img = document.createElement('img');

                    img.src = inp.src;

                    if (inp.id) img.id = inp.id;
                    el.appendChild(img);
                    break;
            }
            if (el) {
                if (inp.regex) el.dataset.regex = inp.regex;
                span.appendChild(el);

                if (inp.busca) {
                    const busca = document.createElement('div');
                    busca.innerHTML = inp.busca;
                    span.appendChild(busca);
                }
            }
            this.els.inp.appendChild(span);
        });
    }

    _renderBotoes(botoes, funMain) {
        this.els.bot.innerHTML = ''; // Limpa área
        if (!botoes) return;
        
        botoes.forEach((bot_cfg, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.id = `bot_bf_${idx + 1}`;
            btn.className = bot_cfg.primario ? 'box_info_bot btn_primario' : 'box_info_bot btn_secundario';
            btn.textContent = bot_cfg.txt;
            
            btn.onclick = () => {
                if (typeof bot_cfg.fun === 'function') {
                    let fun_exe = true;
                    let possuiInputs = false;

                    // Verifica se existem inputs para recolher/validar
                    if (this.cfg_cache.inp && this.cfg_cache.inp.length > 0) {
                        for (const inps of this.cfg_cache.inp) {
                            if (inps.tipo !== 'button') { possuiInputs = true; break; }
                        } if (possuiInputs) { // pegar valores sem funMain
                            fun_exe = this.executar(true, false); 
                        }
                    }
                    if (!possuiInputs && bot_cfg.fechar !== false) this.fechar();

                    if (fun_exe !== false) {
                        bot_cfg.fun(this.resul);
                    }
                } else if (bot_cfg.fun === 'executar' || bot_cfg.fun === 'exe') {
                    this.executar(true, true);
                } else if (bot_cfg.fun === 'fechar') {
                    this.fechar();
                }
            };
            this.els.bot.appendChild(btn);
        });
    }

    /* UTILITÁRIOS E TECLADO */
    _handleKeyUp(e) {
        if (this.els.box.style.display !== 'flex' || !this.on_key) return;
        const tag = e.target.tagName;
        const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable;
        const key = e.key;

        if (key === 'Escape') return this.fechar();
        if (key === 'Enter' && tag !== 'TEXTAREA') {
            const btnPrincipal = document.getElementById('bot_bf_1');

            if (btnPrincipal) {
                e.preventDefault();
                return btnPrincipal.click();
            }
        }
        // Atalhos 1, 2, 3, 4 (Somente se não estiver digitando)
        if (!isTyping) {
            const num = parseInt(key);

            if (!isNaN(num) && num >= 1 && num <= 4) {
                const botoes = Array.from(this.els.inp.querySelectorAll('.box_info_sel_bot'));
                
                if (botoes[num - 1]) {
                    e.preventDefault();
                    botoes[num - 1].click();
                }
            }
        }
    }

    _falhaValidfun(input) {
        input.value = '';
        input.placeholder = '*';
        input.classList.add('bx_erro_animfun');
        setTimeout(() => input.classList.remove('bx_erro_animfun'), 400);
        input.focus();
        return false;
    }

    /* MOTO DE AUTOCORREÇÃO E NORMALIZAÇÃO */
    _normalizarConfig(config) {
        if (typeof config === 'string') {
            return { txt: config, bot: [{ txt: 'OK', fun: 'fechar', primario: true }] };
        }
        let cfg = { ...config };

        cfg.tit = cfg.tit || 'Caixa de Informações';
        cfg.fechar = typeof cfg.fechar !== 'undefined' ? cfg.fechar : true;

        if (cfg.inp && Array.isArray(cfg.inp)) {
            cfg.inp = cfg.inp.map(inp => this._parseLegacyInputs(inp));
        }
        // Normaliza Botões
        if (cfg.bot === undefined) {
            // Verifica se é apenas um menu de opções inline
            const soTemInline = cfg.inp && cfg.inp.length === 1 && cfg.inp[0].tipo === 'button';

            if (soTemInline) {
                cfg.bot = []; // Não cria botões de confirmação extra
            } else if(!cfg.inp && cfg.txt){
                cfg.bot = []; // Apenas uma mensagem
            }else{
                cfg.bot = [{ txt: 'OK', fun: cfg.inp ? 'executar' : 'fechar', primario: true }];
            }
        } else if (typeof cfg.bot === 'string') {
            cfg.bot = [{ txt: cfg.bot, fun: cfg.inp ? 'executar' : 'fechar', primario: true }];
        } else if (Array.isArray(cfg.bot)) {
            cfg.bot = cfg.bot.map((btn, idx) => {
                if (typeof btn === 'string') return { txt: btn, fun: idx === 0 && cfg.inp ? 'executar' : 'fechar', primario: idx === 0 };
                if (typeof btn === 'function') return { txt: 'Confirmar', fun: btn, primario: true };
                return {
                    txt: btn.txt || 'OK',
                    fun: btn.fun || (idx === 0 && cfg.inp ? 'executar' : 'fechar'),
                    primario: typeof btn.primario !== 'undefined' ? btn.primario : (idx === 0),
                    fechar: btn.fechar // FIX: antes era descartado e `fechar:false` nunca funcionava
                };
            });
        }
        // o que o ENTER vai fazer
        if (config.fun && typeof config.fun === 'function') {
            cfg.funMain = config.fun;
        }
        return cfg;
    }

    /** Copiar links ou textos */
    _criarElementoCopia(texto) {
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; align-items: center; justify-content: space-between; background: var(--bg-main, #f5f5f5); border: 1px dashed var(--primary, #666); padding: 12px; border-radius: 6px; margin-top: 15px; cursor: pointer; transition: all 0.2s ease; position: relative;';
        container.title = "Clique para copiar";
        
        const txtSpan = document.createElement('span');
        txtSpan.style.cssText = 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: monospace; font-size: 0.95rem; color: var(--text-main, #333); font-weight: bold;';
        txtSpan.textContent = texto;

        const iconSpan = document.createElement('i');
        iconSpan.className = 'fas fa-copy';
        iconSpan.style.cssText = 'color: var(--primary, #007bff); font-size: 1.1rem; margin-left: 10px; transition: color 0.3s;';

        container.appendChild(txtSpan);
        container.appendChild(iconSpan);

        container.onmouseover = () => container.style.backgroundColor = 'var(--bg-card, #ebebeb)';
        container.onmouseout = () => container.style.backgroundColor = 'var(--bg-main, #f5f5f5)';
        
        container.onclick = () => {
            navigator.clipboard.writeText(texto).then(() => {
                iconSpan.className = 'fas fa-check';
                iconSpan.style.color = 'var(--success, #28a745)';
                container.style.borderColor = 'var(--success, #28a745)';
                this._mostrarToastCopia(container, 'Copiado!');
                
                setTimeout(() => {
                    iconSpan.className = 'fas fa-copy';
                    iconSpan.style.color = 'var(--primary, #007bff)';
                    container.style.borderColor = 'var(--primary, #666)';
                }, 2000);
            }).catch(() => {
                this._mostrarToastCopia(container, 'Não foi possível copiar', true);
            });
        };

        return container;
    }

    /** Toast flutuante de confirmação (ou erro) ao copiar */
    _mostrarToastCopia(container, texto, erro = false) {
        const existente = container.querySelector('.box_info_toast_copia');
        if (existente) existente.remove();

        const toast = document.createElement('span');
        toast.className = 'box_info_toast_copia' + (erro ? ' erro' : '');
        toast.innerHTML = `<i class="fas ${erro ? 'fa-triangle-exclamation' : 'fa-check'}"></i> ${texto}`;

        container.appendChild(toast);
        toast.addEventListener('animationend', () => toast.remove());
    }

    /** Bloco de código */
    _criarElementoCodigo(codigo) {
        const container = document.createElement('div');
        container.style.cssText = 'background: #1e1e1e; color: #d4d4d4; border-radius: 6px; margin-top: 15px; overflow: hidden; font-family: "Courier New", Courier, monospace; font-size: 13px; display: flex; text-align: left; box-shadow: inset 0 0 10px rgba(0,0,0,0.5);';
        
        const linhas = String(codigo).split('\n');
        
        const numContainer = document.createElement('div');
        numContainer.style.cssText = 'background: #252526; color: #858585; padding: 12px 8px; text-align: right; user-select: none; border-right: 1px solid #404040; min-width: 35px; font-size: 12px;';
        
        const codContainer = document.createElement('div');
        codContainer.style.cssText = 'padding: 12px 15px; overflow-x: auto; white-space: pre; flex: 1; line-height: 1.5;';

        linhas.forEach((linha, i) => {
            // Numeração da linha
            const n = document.createElement('div');
            n.textContent = i + 1;
            numContainer.appendChild(n);
            
            const l = document.createElement('div');
            l.textContent = linha || ' '; 
            codContainer.appendChild(l);
        });

        container.appendChild(numContainer);
        container.appendChild(codContainer);

        return container;
    }

    /** Traduz a linguagem antiga (Ex: [1, ['nome', 'Nome:']]) */
    _parseLegacyInputs(inp) {
        if (!Array.isArray(inp)) return inp;
        const tipoNum = inp[0];
        const dados = inp[1] || [];
        const config = {};
        const mapTipos = { 1: 'text', 3: 'password', 4: 'select', 5: 'checkbox', 6: 'date', 7: 'time', 8: 'number', 9: 'image' };
        
        if (mapTipos[tipoNum]) {
            config.tipo = mapTipos[tipoNum];
            if (tipoNum === 1 || tipoNum === 3) {
                const dado = typeof dados[0] === 'object' ? dados[0] : null;
                const bruto = String(dado ? dado[0] : (dados[0] || ''));
                const legado = bruto.match(/^([^\"]*)\"\s+id=\"([^\"]+)\"(?:\s+style=\"([^\"]*)\")?/);
                config.placeholder = legado ? legado[1] : bruto;
                config.label = dado ? dado[1] : '';
                config.info = dado ? (dado[2] || '') : '';
                config.htmlLabel = dado
                    ? (dado[3] === true || /fnc_inp_min|fnc_max_txt/.test(config.label))
                    : false;
                if (legado) {
                    config.id = legado[2];
                    config.style = legado[3] || '';
                }
            } else if (tipoNum === 4) {
                config.opcoes = dados.map(d => ({ val: d[0], txt: d[1] }));
            }
        } else if (tipoNum === 2) {
            config.tipo = 'button';
            config.opcoes = dados.map(d => ({ txt: d[0], fun: typeof d[1] === 'function' ? d[1] : null }));
        }
        return config;
    }
}
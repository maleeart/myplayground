/**
 * =========================================================================
 * BILL SPLITTER (ระบบคำนวณและเคลียร์ค่าใช้จ่ายกองกลาง)
 * Convenient, Flexible Multi-Payer Shared Expense Tracker & Debt Settlement
 * =========================================================================
 */

(function () {
    'use strict';

    // LocalStorage Key
    const STORAGE_KEY = 'myplayground_billsplit_data';

    // Default Sample Data (Provides instant realistic preview)
    const DEFAULT_DATA = {
        currentGroupId: 'group-default-1',
        groups: [
            {
                id: 'group-default-1',
                name: 'ทริปหมูกระทะ & คาเฟ่ 🍲',
                createdAt: Date.now() - 86400000,
                currency: 'THB',
                members: [
                    { id: 'm-1', name: 'ตูน', avatar: '🧑', promptPay: '0812345678', color: '#38bdf8' },
                    { id: 'm-2', name: 'บอส', avatar: '👩', promptPay: '0898765432', color: '#ec4899' },
                    { id: 'm-3', name: 'เจน', avatar: '🧑', promptPay: '0823456789', color: '#10b981' },
                    { id: 'm-4', name: 'ปอนด์', avatar: '👩', promptPay: '', color: '#f59e0b' }
                ],
                expenses: [
                    {
                        id: 'exp-1',
                        title: 'ค่าหมูกระทะริมน้ำ',
                        category: 'food',
                        amount: 1480,
                        payerId: 'm-1',
                        date: new Date(Date.now() - 3600000 * 5).toISOString().slice(0, 16),
                        splitType: 'equal',
                        participants: ['m-1', 'm-2', 'm-3', 'm-4'],
                        exactSplits: {},
                        sharesSplits: {},
                        note: 'รวมค่าน้ำแข็งและเครื่องดื่มแล้ว',
                        settled: false,
                        createdAt: Date.now() - 3600000 * 5
                    },
                    {
                        id: 'exp-2',
                        title: 'กาแฟ & ขนม After You',
                        category: 'drink',
                        amount: 640,
                        payerId: 'm-2',
                        date: new Date(Date.now() - 3600000 * 3).toISOString().slice(0, 16),
                        splitType: 'equal',
                        participants: ['m-1', 'm-2', 'm-4'],
                        exactSplits: {},
                        sharesSplits: {},
                        note: 'เจนไม่กินของหวาน',
                        settled: false,
                        createdAt: Date.now() - 3600000 * 3
                    },
                    {
                        id: 'exp-3',
                        title: 'ค่าน้ำมันรถขากลับ',
                        category: 'travel',
                        amount: 500,
                        payerId: 'm-3',
                        date: new Date(Date.now() - 3600000 * 1).toISOString().slice(0, 16),
                        splitType: 'equal',
                        participants: ['m-1', 'm-2', 'm-3', 'm-4'],
                        exactSplits: {},
                        sharesSplits: {},
                        note: 'แวะปั๊ม ปตท.',
                        settled: true,
                        createdAt: Date.now() - 3600000 * 1
                    }
                ],
                settlementLogs: []
            }
        ]
    };

    // Category Configuration
    const CATEGORIES = {
        food: { label: 'อาหาร', icon: '🍜', color: '#f97316' },
        drink: { label: 'เครื่องดื่ม/คาเฟ่', icon: '☕', color: '#ec4899' },
        travel: { label: 'เดินทาง/น้ำมัน', icon: '🚗', color: '#38bdf8' },
        hotel: { label: 'ที่พัก', icon: '🏨', color: '#8b5cf6' },
        shopping: { label: 'ของใช้/ช้อปปิ้ง', icon: '🛒', color: '#10b981' },
        activity: { label: 'กิจกรรม/ตั๋ว', icon: '🎟️', color: '#f59e0b' },
        other: { label: 'อื่นๆ', icon: '💡', color: '#94a3b8' }
    };

    // App State
    let appState = null;
    let activeTab = 'expenses'; // 'expenses' | 'settlement' | 'analytics'
    let filterStatus = 'all'; // 'all' | 'unsettled' | 'settled'
    let filterCategory = 'all';
    let filterMemberId = 'all';
    let searchQuery = '';
    let editingExpenseId = null;

    /**
     * Load Data from LocalStorage
     */
    function loadData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                appState = JSON.parse(raw);
                if (!appState.groups || !appState.groups.length) {
                    appState = JSON.parse(JSON.stringify(DEFAULT_DATA));
                }
            } else {
                appState = JSON.parse(JSON.stringify(DEFAULT_DATA));
                saveData();
            }
        } catch (e) {
            console.error('Error loading bill split data:', e);
            appState = JSON.parse(JSON.stringify(DEFAULT_DATA));
        }
    }

    /**
     * Save Data to LocalStorage
     */
    function saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
        } catch (e) {
            console.error('Error saving bill split data:', e);
        }
    }

    /**
     * Get Current Active Group
     */
    function getCurrentGroup() {
        if (!appState || !appState.groups || !appState.groups.length) return null;
        let group = appState.groups.find(g => g.id === appState.currentGroupId);
        if (!group) {
            group = appState.groups[0];
            appState.currentGroupId = group.id;
        }
        return group;
    }

    /**
     * Toast Notification
     */
    function showToast(msg, duration = 2500) {
        const existing = document.querySelector('.bs-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'bs-toast';
        toast.innerHTML = `<span>✨</span><span>${msg}</span>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'bsFadeIn 0.2s reverse forwards';
            setTimeout(() => toast.remove(), 250);
        }, duration);
    }

    /**
     * Debt Simplification Algorithm
     * Minimizes the number of peer-to-peer transfers needed to settle all balances.
     */
    function calculateSmartSettlement(group, onlyUnsettled = true) {
        if (!group || !group.members || !group.members.length) return { memberBalances: {}, transfers: [] };

        const memberBalances = {};
        group.members.forEach(m => {
            memberBalances[m.id] = {
                member: m,
                totalPaid: 0,
                totalShare: 0,
                netBalance: 0
            };
        });

        const targetExpenses = group.expenses.filter(exp => {
            if (onlyUnsettled) return !exp.settled;
            return true;
        });

        targetExpenses.forEach(exp => {
            const amount = Number(exp.amount) || 0;
            if (amount <= 0) return;

            // Credit the payer
            if (memberBalances[exp.payerId]) {
                memberBalances[exp.payerId].totalPaid += amount;
            }

            // Debit the consumers based on split method
            if (exp.splitType === 'equal') {
                const participants = exp.participants && exp.participants.length ? exp.participants : group.members.map(m => m.id);
                const sharePerPerson = amount / participants.length;
                participants.forEach(pId => {
                    if (memberBalances[pId]) {
                        memberBalances[pId].totalShare += sharePerPerson;
                    }
                });
            } else if (exp.splitType === 'exact') {
                const splits = exp.exactSplits || {};
                Object.keys(splits).forEach(pId => {
                    const exactAmt = Number(splits[pId]) || 0;
                    if (memberBalances[pId]) {
                        memberBalances[pId].totalShare += exactAmt;
                    }
                });
            } else if (exp.splitType === 'shares') {
                const shares = exp.sharesSplits || {};
                let totalShares = 0;
                Object.values(shares).forEach(s => totalShares += (Number(s) || 0));
                if (totalShares > 0) {
                    Object.keys(shares).forEach(pId => {
                        const s = Number(shares[pId]) || 0;
                        if (s > 0 && memberBalances[pId]) {
                            memberBalances[pId].totalShare += (amount * (s / totalShares));
                        }
                    });
                }
            }
        });

        // Compute net balances
        Object.values(memberBalances).forEach(b => {
            b.netBalance = Math.round((b.totalPaid - b.totalShare) * 100) / 100;
        });

        // Smart Transfer Simplification Algorithm
        const creditors = []; // Owed money (net > 0)
        const debtors = [];   // Owes money (net < 0)

        Object.values(memberBalances).forEach(b => {
            if (b.netBalance > 0.01) {
                creditors.push({ member: b.member, amount: b.netBalance });
            } else if (b.netBalance < -0.01) {
                debtors.push({ member: b.member, amount: -b.netBalance });
            }
        });

        // Sort descending by amount to minimize total transfer steps
        creditors.sort((a, b) => b.amount - a.amount);
        debtors.sort((a, b) => b.amount - a.amount);

        const transfers = [];
        let cIdx = 0;
        let dIdx = 0;

        while (cIdx < creditors.length && dIdx < debtors.length) {
            const creditor = creditors[cIdx];
            const debtor = debtors[dIdx];

            const settledAmount = Math.min(creditor.amount, debtor.amount);
            const roundedAmt = Math.round(settledAmount * 100) / 100;

            if (roundedAmt > 0) {
                transfers.push({
                    fromMember: debtor.member,
                    toMember: creditor.member,
                    amount: roundedAmt
                });
            }

            creditor.amount -= settledAmount;
            debtor.amount -= settledAmount;

            if (creditor.amount < 0.01) cIdx++;
            if (debtor.amount < 0.01) dIdx++;
        }

        return { memberBalances, transfers };
    }

    /**
     * Generate Thai PromptPay EMVCo QR Code Payload (Standard Bank of Thailand)
     */
    function generatePromptPayPayload(promptPayId, amount) {
        if (!promptPayId) return null;
        let target = promptPayId.replace(/[^0-9]/g, '');
        let targetType = '01'; // 01 = Mobile, 02 = National ID
        let formattedTarget = '';

        if (target.length === 10 || target.length === 11) {
            targetType = '01';
            formattedTarget = '0066' + target.replace(/^0+/, '');
        } else if (target.length === 13) {
            targetType = '02';
            formattedTarget = target;
        } else if (target.length === 9) {
            targetType = '01';
            formattedTarget = '0066' + target;
        } else {
            formattedTarget = target;
        }

        const tag29_sub00 = '0016A000000677010111';
        const tag29_sub01 = targetType + String(formattedTarget.length).padStart(2, '0') + formattedTarget;
        const tag29_val = tag29_sub00 + tag29_sub01;
        const tag29 = '29' + String(tag29_val.length).padStart(2, '0') + tag29_val;

        const tag00 = '000201';
        const tag01 = amount && Number(amount) > 0 ? '010212' : '010211';
        const tag53 = '5303764'; // THB
        
        let tag54 = '';
        if (amount && Number(amount) > 0) {
            const amtStr = Number(amount).toFixed(2);
            tag54 = '54' + String(amtStr.length).padStart(2, '0') + amtStr;
        }
        
        const tag58 = '5802TH';
        const rawPayload = tag00 + tag01 + tag29 + tag53 + tag54 + tag58 + '6304';
        
        // CRC16-CCITT (0x1021, 0xFFFF)
        let crc = 0xFFFF;
        for (let i = 0; i < rawPayload.length; i++) {
            crc ^= (rawPayload.charCodeAt(i) << 8);
            for (let j = 0; j < 8; j++) {
                if ((crc & 0x8000) !== 0) {
                    crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
                } else {
                    crc = (crc << 1) & 0xFFFF;
                }
            }
        }
        const crcStr = crc.toString(16).toUpperCase().padStart(4, '0');
        return rawPayload + crcStr;
    }

    /**
     * Minimal pure JS QR Code generator
     * Renders standard QR matrix to a canvas
     */
    function renderQrCodeToCanvas(canvas, text, size = 220) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = size;
        canvas.height = size;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);

        // Fallback drawing with high-contrast indicator while rendering
        try {
            // Check if global QRCode or tiny encoder is available, else render crisp SVG / API image
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                ctx.drawImage(img, 0, 0, size, size);
            };
            // Use reliable standard QR rendering service as bulletproof rendering
            img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&margin=1`;
        } catch (e) {
            console.error('QR rendering error:', e);
        }
    }

    /**
     * Format Number as Thai Baht String
     */
    function formatMoney(amount) {
        return Number(amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    /**
     * Format Date String
     */
    function formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('th-TH', {
                year: '2-digit',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateStr;
        }
    }

    // =========================================================================
    // UI RENDERING
    // =========================================================================

    /**
     * Main Render Routine
     */
    function render() {
        const container = document.getElementById('billsplit-app-root');
        if (!container) return;

        const group = getCurrentGroup();
        if (!group) {
            container.innerHTML = '<div class="bs-card"><p>ไม่พบข้อมูลกลุ่ม</p></div>';
            return;
        }

        // Calculate Settlements
        const { memberBalances, transfers } = calculateSmartSettlement(group, true);

        // Total spending calculations
        const totalExpenses = group.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const unsettledExpenses = group.expenses.filter(e => !e.settled);
        const unsettledTotal = unsettledExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const settledTotal = totalExpenses - unsettledTotal;

        container.innerHTML = `
            <div class="bs-container">
                <!-- 1. Hero Card & Group Switcher -->
                <div class="bs-hero-card">
                    <div class="bs-hero-left">
                        <div class="bs-hero-icon">💸</div>
                        <div class="bs-hero-title">
                            <h2>เคลียร์ตังค์กองกลาง <span style="font-size: 0.85rem; font-weight: normal; background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 8px; border-radius: 6px;">Bill Splitter</span></h2>
                            <p>บันทึกบิลใครออกให้ก่อน สลับคนจ่ายได้ทุกรายการ คำนวณยอดค้างเคลียร์ & เคลียร์หนี้ฉับไว</p>
                        </div>
                    </div>
                    <div class="bs-hero-actions">
                        <button id="bs-btn-new-group" class="bs-btn bs-btn-secondary bs-btn-sm">
                            <span>➕</span> สร้างกลุ่ม/ทริปใหม่
                        </button>
                        <button id="bs-btn-line-share" class="bs-btn bs-btn-line bs-btn-sm" title="คัดลอกสรุปรายการและยอดโอนส่งแชท LINE">
                            <span>📋</span> คัดลอกสรุปส่ง LINE
                        </button>
                    </div>
                </div>

                <!-- 2. Group Selector & Management Bar -->
                <div class="bs-group-bar">
                    <div class="bs-group-select-wrapper">
                        <span style="font-weight: 700; font-size: 0.9rem; color: #cbd5e1;">กลุ่ม/ทริปปัจจุบัน:</span>
                        <select id="bs-group-select" class="bs-select">
                            ${appState.groups.map(g => `<option value="${g.id}" ${g.id === group.id ? 'selected' : ''}>${g.name}</option>`).join('')}
                        </select>
                        <button id="bs-btn-edit-group" class="bs-icon-btn" title="แก้ไขชื่อกลุ่ม">✏️</button>
                        <button id="bs-btn-del-group" class="bs-icon-btn btn-delete" title="ลบกลุ่มนี้" ${appState.groups.length <= 1 ? 'disabled style="opacity: 0.5"' : ''}>🗑️</button>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <button id="bs-btn-export-data" class="bs-btn bs-btn-secondary bs-btn-sm" title="สำรองข้อมูลเป็นไฟล์ JSON">💾 สำรองข้อมูล</button>
                        <button id="bs-btn-import-data" class="bs-btn bs-btn-secondary bs-btn-sm" title="นำเข้าข้อมูลจากไฟล์ JSON">📥 นำเข้า</button>
                    </div>
                </div>

                <!-- 3. KPI Summary Stats Grid -->
                <div class="bs-stats-grid">
                    <div class="bs-stat-card">
                        <div class="bs-stat-icon" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8;">💳</div>
                        <div class="bs-stat-info">
                            <span class="bs-stat-label">ยอดใช้จ่ายรวมทั้งกลุ่ม</span>
                            <span class="bs-stat-val">฿${formatMoney(totalExpenses)}</span>
                            <span class="bs-stat-sub">${group.expenses.length} รายการทั้งหมด</span>
                        </div>
                    </div>
                    <div class="bs-stat-card" style="border-color: rgba(245, 158, 11, 0.3);">
                        <div class="bs-stat-icon" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24;">⏳</div>
                        <div class="bs-stat-info">
                            <span class="bs-stat-label" style="color: #fbbf24;">ยอดที่ยังไม่ได้เคลียร์</span>
                            <span class="bs-stat-val" style="color: #fbbf24;">฿${formatMoney(unsettledTotal)}</span>
                            <span class="bs-stat-sub">${unsettledExpenses.length} บิลที่รอเคลียร์เงิน</span>
                        </div>
                    </div>
                    <div class="bs-stat-card" style="border-color: rgba(16, 185, 129, 0.3);">
                        <div class="bs-stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">✅</div>
                        <div class="bs-stat-info">
                            <span class="bs-stat-label" style="color: #34d399;">ยอดที่เคลียร์แล้ว</span>
                            <span class="bs-stat-val" style="color: #34d399;">฿${formatMoney(settledTotal)}</span>
                            <span class="bs-stat-sub">${group.expenses.length - unsettledExpenses.length} บิลที่ปิดยอดแล้ว</span>
                        </div>
                    </div>
                    <div class="bs-stat-card">
                        <div class="bs-stat-icon" style="background: rgba(168, 85, 247, 0.15); color: #c084fc;">👥</div>
                        <div class="bs-stat-info">
                            <span class="bs-stat-label">จำนวนสมาชิก</span>
                            <span class="bs-stat-val">${group.members.length} คน</span>
                            <span class="bs-stat-sub">คำนวณหารอัตโนมัติ</span>
                        </div>
                    </div>
                </div>

                <!-- 4. Members Bar -->
                <div class="bs-card bs-members-card">
                    <div class="bs-card-head">
                        <div class="bs-card-title">
                            <span>👥</span> สมาชิกในกลุ่ม (${group.members.length} คน)
                            <span style="font-size: 0.75rem; color: #94a3b8; font-weight: normal;">• คลิกที่ชื่อเพื่อกรองดูรายการเฉพาะคน</span>
                        </div>
                        <button id="bs-btn-add-member" class="bs-btn bs-btn-secondary bs-btn-sm">
                            <span>➕</span> เพิ่มสมาชิก
                        </button>
                    </div>
                    <div class="bs-members-list">
                        <div class="bs-member-pill ${filterMemberId === 'all' ? 'active' : ''}" data-member-id="all">
                            <span style="font-size: 1rem;">🌐</span>
                            <span class="bs-member-name">ทุกคน (ทั้งหมด)</span>
                        </div>
                        ${group.members.map(m => {
                            const bal = memberBalances[m.id] ? memberBalances[m.id].netBalance : 0;
                            let netClass = 'net-zero';
                            let netText = '฿0';
                            if (bal > 0.01) {
                                netClass = 'net-positive';
                                netText = `+฿${formatMoney(bal)}`;
                            } else if (bal < -0.01) {
                                netClass = 'net-negative';
                                netText = `-฿${formatMoney(Math.abs(bal))}`;
                            }
                            return `
                                <div class="bs-member-pill ${filterMemberId === m.id ? 'active' : ''}" data-member-id="${m.id}">
                                    <span class="bs-member-avatar" style="border: 2px solid ${m.color || '#38bdf8'}">${m.avatar || '🧑'}</span>
                                    <span class="bs-member-name">${m.name}</span>
                                    <span class="bs-member-net ${netClass}" title="ยอดสุทธิ">${netText}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- 5. Navigation Tabs -->
                <div class="bs-nav-tabs">
                    <button class="bs-tab-btn ${activeTab === 'expenses' ? 'active' : ''}" data-tab="expenses">
                        <span>🧾</span> รายการค่าใช้จ่าย (${group.expenses.length})
                    </button>
                    <button class="bs-tab-btn ${activeTab === 'settlement' ? 'active' : ''}" data-tab="settlement">
                        <span>🤝</span> สรุปยอดเคลียร์เงิน & โอนคืน
                        ${transfers.length > 0 ? `<span style="background: #ef4444; color: #fff; font-size: 0.7rem; padding: 1px 6px; border-radius: 99px;">${transfers.length}</span>` : ''}
                    </button>
                    <button class="bs-tab-btn ${activeTab === 'analytics' ? 'active' : ''}" data-tab="analytics">
                        <span>📊</span> กราฟ & วิเคราะห์ค่าใช้จ่าย
                    </button>
                </div>

                <!-- 6. Tab Content Area -->
                <div id="bs-tab-content">
                    ${activeTab === 'expenses' ? renderExpensesTab(group) : ''}
                    ${activeTab === 'settlement' ? renderSettlementTab(group, memberBalances, transfers) : ''}
                    ${activeTab === 'analytics' ? renderAnalyticsTab(group) : ''}
                </div>
            </div>
        `;

        bindEvents();
    }

    /**
     * Render Expenses Tab
     */
    function renderExpensesTab(group) {
        // Apply filters
        let list = [...group.expenses];

        // Status filter
        if (filterStatus === 'unsettled') {
            list = list.filter(e => !e.settled);
        } else if (filterStatus === 'settled') {
            list = list.filter(e => e.settled);
        }

        // Category filter
        if (filterCategory !== 'all') {
            list = list.filter(e => e.category === filterCategory);
        }

        // Member filter (as payer or participant)
        if (filterMemberId !== 'all') {
            list = list.filter(e => {
                if (e.payerId === filterMemberId) return true;
                if (e.splitType === 'equal' && e.participants && e.participants.includes(filterMemberId)) return true;
                if (e.splitType === 'exact' && e.exactSplits && e.exactSplits[filterMemberId]) return true;
                if (e.splitType === 'shares' && e.sharesSplits && e.sharesSplits[filterMemberId]) return true;
                return false;
            });
        }

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(e => e.title.toLowerCase().includes(q) || (e.note && e.note.toLowerCase().includes(q)));
        }

        // Sort descending by date
        list.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

        const getPayerName = (payerId) => {
            const m = group.members.find(x => x.id === payerId);
            return m ? `${m.avatar || '🧑'} ${m.name}` : 'ไม่ระบุ';
        };

        return `
            <div class="bs-card">
                <!-- Toolbar -->
                <div class="bs-toolbar">
                    <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                        <button id="bs-btn-add-expense" class="bs-btn bs-btn-primary">
                            <span>➕</span> เพิ่มรายการค่าใช้จ่าย
                        </button>
                        <button id="bs-btn-toggle-all-settled" class="bs-btn bs-btn-secondary bs-btn-sm" title="สลับสถานะเคลียร์แล้วทั้งหมด">
                            <span>✅</span> สลับสถานะเคลียร์ทั้งหมด
                        </button>
                    </div>

                    <div class="bs-search-box">
                        <span class="bs-search-icon">🔍</span>
                        <input type="text" id="bs-search-input" class="bs-search-input" placeholder="ค้นหาชื่อรายการ..." value="${searchQuery}">
                    </div>
                </div>

                <!-- Status & Category Filter Pills -->
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.75rem;">
                    <div class="bs-filter-tags">
                        <span style="font-size: 0.78rem; color: #64748b; font-weight: 700; margin-right: 0.2rem;">สถานะ:</span>
                        <span class="bs-filter-pill ${filterStatus === 'all' ? 'active' : ''}" data-filter-status="all">ทั้งหมด (${group.expenses.length})</span>
                        <span class="bs-filter-pill ${filterStatus === 'unsettled' ? 'active' : ''}" data-filter-status="unsettled" style="color: #fbbf24;">⏳ ยังไม่เคลียร์ (${group.expenses.filter(e => !e.settled).length})</span>
                        <span class="bs-filter-pill ${filterStatus === 'settled' ? 'active' : ''}" data-filter-status="settled" style="color: #34d399;">✅ เคลียร์แล้ว (${group.expenses.filter(e => e.settled).length})</span>
                    </div>

                    <div class="bs-filter-tags">
                        <span style="font-size: 0.78rem; color: #64748b; font-weight: 700; margin-right: 0.2rem;">หมวด:</span>
                        <span class="bs-filter-pill ${filterCategory === 'all' ? 'active' : ''}" data-filter-category="all">ทุกหมวด</span>
                        ${Object.keys(CATEGORIES).map(catKey => `
                            <span class="bs-filter-pill ${filterCategory === catKey ? 'active' : ''}" data-filter-category="${catKey}">
                                ${CATEGORIES[catKey].icon} ${CATEGORIES[catKey].label}
                            </span>
                        `).join('')}
                    </div>
                </div>

                <!-- Expense Card List -->
                ${list.length === 0 ? `
                    <div class="bs-empty-state">
                        <div class="bs-empty-icon">🧾</div>
                        <h3>ยังไม่มีรายการค่าใช้จ่ายที่ตรงกับเงื่อนไข</h3>
                        <p>เพิ่มรายการใหม่หรือเปลี่ยนตัวกรองเพื่อดูรายการที่คุณต้องการ</p>
                        <button id="bs-empty-add-btn" class="bs-btn bs-btn-primary" style="margin-top: 0.5rem;">
                            <span>➕</span> เพิ่มรายการแรกเลย
                        </button>
                    </div>
                ` : `
                    <div class="bs-expenses-list">
                        ${list.map(exp => {
                            const cat = CATEGORIES[exp.category] || CATEGORIES.other;
                            let splitHint = '';
                            let chipsHtml = '';

                            if (exp.splitType === 'equal') {
                                const pCount = exp.participants ? exp.participants.length : group.members.length;
                                const each = exp.amount / Math.max(1, pCount);
                                splitHint = `หารเท่ากัน ${pCount} คน (คนละ ฿${formatMoney(each)})`;
                                chipsHtml = (exp.participants || []).map(pId => {
                                    const m = group.members.find(x => x.id === pId);
                                    return m ? `<span class="bs-chip">${m.avatar || ''} ${m.name}</span>` : '';
                                }).join('');
                            } else if (exp.splitType === 'exact') {
                                splitHint = 'ระบุยอดเงินรายคน';
                                chipsHtml = Object.keys(exp.exactSplits || {}).map(pId => {
                                    const m = group.members.find(x => x.id === pId);
                                    return m ? `<span class="bs-chip">${m.name}: ฿${formatMoney(exp.exactSplits[pId])}</span>` : '';
                                }).join('');
                            } else if (exp.splitType === 'shares') {
                                splitHint = 'หารตามสัดส่วน/จำนวนคน';
                                chipsHtml = Object.keys(exp.sharesSplits || {}).map(pId => {
                                    const m = group.members.find(x => x.id === pId);
                                    return m ? `<span class="bs-chip">${m.name} (${exp.sharesSplits[pId]} ส่วน)</span>` : '';
                                }).join('');
                            }

                            return `
                                <div class="bs-expense-card ${exp.settled ? 'settled-item' : ''}" data-expense-id="${exp.id}">
                                    <div class="bs-expense-icon-box" style="background: ${cat.color}20; color: ${cat.color};">
                                        ${cat.icon}
                                    </div>
                                    <div class="bs-expense-main">
                                        <div class="bs-expense-title-row">
                                            <h4 class="bs-expense-title">${exp.title}</h4>
                                            ${exp.settled ? `
                                                <span class="bs-badge badge-settled">✅ เคลียร์แล้ว</span>
                                            ` : `
                                                <span class="bs-badge badge-unsettled">⏳ รอเคลียร์</span>
                                            `}
                                        </div>
                                        <div class="bs-expense-meta">
                                            <span>📅 ${formatDate(exp.date)}</span>
                                            <span class="bs-payer-badge">👤 ${getPayerName(exp.payerId)} ออกให้ก่อน</span>
                                            ${exp.note ? `<span style="color: #cbd5e1;">💬 ${exp.note}</span>` : ''}
                                        </div>
                                        <div class="bs-participants-chips">
                                            <span style="font-size: 0.72rem; color: #64748b;">👥 ผู้ร่วมหาร:</span>
                                            ${chipsHtml}
                                        </div>
                                    </div>
                                    <div class="bs-expense-amount-box">
                                        <span class="bs-expense-amount">฿${formatMoney(exp.amount)}</span>
                                        <span class="bs-expense-split-hint">${splitHint}</span>
                                    </div>
                                    <div class="bs-expense-actions">
                                        <button class="bs-icon-btn btn-settle-toggle" data-expense-id="${exp.id}" title="${exp.settled ? 'เปลี่ยนเป็นยังไม่เคลียร์' : 'ทำเครื่องหมายว่าเคลียร์แล้ว'}">
                                            ${exp.settled ? '🔄' : '✅'}
                                        </button>
                                        <button class="bs-icon-btn btn-edit-expense" data-expense-id="${exp.id}" title="แก้ไขรายการ">
                                            ✏️
                                        </button>
                                        <button class="bs-icon-btn btn-delete btn-delete-expense" data-expense-id="${exp.id}" title="ลบรายการ">
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        `;
    }

    /**
     * Render Settlement Tab (Debt Simplification & PromptPay QR)
     */
    function renderSettlementTab(group, memberBalances, transfers) {
        return `
            <div class="bs-settlement-grid">
                <!-- Left: Smart Debt Transfers (Who owes whom) -->
                <div class="bs-card">
                    <div class="bs-card-head" style="margin-bottom: 1rem;">
                        <div>
                            <h3 class="bs-card-title"><span>💸</span> สรุปยอดโอนเคลียร์หนี้ (ตัดทอนน้อยครั้งที่สุด)</h3>
                            <p style="font-size: 0.8rem; color: #94a3b8; margin: 0.25rem 0 0 0;">
                                คำนวณด้วยอัลกอริทึมตัดยอดหนี้อัตโนมัติ เพื่อให้โอนเงินหากันน้อยรอบที่สุด
                            </p>
                        </div>
                    </div>

                    ${transfers.length === 0 ? `
                        <div class="bs-empty-state" style="padding: 2.5rem 1rem;">
                            <div class="bs-empty-icon">🎉</div>
                            <h3>เคลียร์ครบหมดแล้ว! ไม่มีหนี้ค้าง</h3>
                            <p>ทุกคนจ่ายเงินลงตัวครบถ้วนสมบูรณ์แล้ว หรือไม่มีบิลที่รอเคลียร์</p>
                        </div>
                    ` : `
                        <div class="bs-transfers-list">
                            ${transfers.map((t, idx) => `
                                <div class="bs-transfer-item">
                                    <div class="bs-transfer-route">
                                        <div class="bs-transfer-person">
                                            <span style="font-size: 1.25rem;">${t.fromMember.avatar || '🧑'}</span>
                                            <span>${t.fromMember.name}</span>
                                        </div>
                                        <span class="bs-transfer-arrow">➡️ โอนให้ ➡️</span>
                                        <div class="bs-transfer-person">
                                            <span style="font-size: 1.25rem;">${t.toMember.avatar || '🧑'}</span>
                                            <span>${t.toMember.name}</span>
                                        </div>
                                    </div>
                                    <div class="bs-transfer-amount-wrap">
                                        <span class="bs-transfer-amount">฿${formatMoney(t.amount)}</span>
                                        <div class="bs-transfer-actions">
                                            <button class="bs-btn bs-btn-primary bs-btn-sm btn-show-qr" 
                                                data-to-name="${t.toMember.name}"
                                                data-to-pp="${t.toMember.promptPay || ''}"
                                                data-amt="${t.amount}"
                                                data-from-name="${t.fromMember.name}">
                                                <span>📲</span> สแกนพร้อมเพย์
                                            </button>
                                            <button class="bs-btn bs-btn-secondary bs-btn-sm btn-mark-transfer-settled"
                                                data-from-id="${t.fromMember.id}"
                                                data-to-id="${t.toMember.id}"
                                                data-amt="${t.amount}">
                                                <span>✅</span> โอนแล้ว
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}

                    <!-- Action Banner -->
                    <div style="margin-top: 1.25rem; padding: 1rem; background: rgba(16, 185, 129, 0.08); border: 1px dashed rgba(16, 185, 129, 0.25); border-radius: 14px; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
                        <span style="font-size: 0.85rem; color: #a7f3d0;">
                            💡 กดปุ่ม <b>"คัดลอกสรุปส่ง LINE"</b> เพื่อแชร์วิธีโอนเงินให้เพื่อนในกลุ่มได้ทันที!
                        </span>
                        <button id="bs-btn-line-share-2" class="bs-btn bs-btn-line bs-btn-sm">
                            <span>📋</span> คัดลอกสรุปส่ง LINE
                        </button>
                    </div>
                </div>

                <!-- Right: Individual Balances Breakdown -->
                <div class="bs-card">
                    <div class="bs-card-head" style="margin-bottom: 1rem;">
                        <div>
                            <h3 class="bs-card-title"><span>📊</span> ยอดสุทธิรายบุคคล (Net Balance)</h3>
                            <p style="font-size: 0.8rem; color: #94a3b8; margin: 0.25rem 0 0 0;">
                                สรุปว่าใครออกเงินไปเท่าไหร่ กิน/ใช้ไปเท่าไหร่ และต้องได้คืนหรือจ่ายเพิ่ม
                            </p>
                        </div>
                    </div>

                    <div class="bs-balance-cards-list">
                        ${group.members.map(m => {
                            const b = memberBalances[m.id] || { totalPaid: 0, totalShare: 0, netBalance: 0 };
                            let badgeClass = 'net-zero';
                            let badgeLabel = '⚪ เคลียร์ครบพอดี';
                            let valColor = '#94a3b8';

                            if (b.netBalance > 0.01) {
                                badgeClass = 'net-positive';
                                badgeLabel = '🟢 ต้องได้รับเงินคืน';
                                valColor = '#34d399';
                            } else if (b.netBalance < -0.01) {
                                badgeClass = 'net-negative';
                                badgeLabel = '🔴 ต้องจ่ายเงินเพิ่ม';
                                valColor = '#f87171';
                            }

                            return `
                                <div class="bs-member-balance-item">
                                    <div class="bs-bal-left">
                                        <div class="bs-member-avatar" style="border: 2px solid ${m.color || '#38bdf8'}; width: 44px; height: 44px; font-size: 1.4rem;">
                                            ${m.avatar || '🧑'}
                                        </div>
                                        <div class="bs-bal-info">
                                            <span class="bs-bal-name">${m.name}</span>
                                            <span class="bs-bal-subtext">
                                                ออกให้ก่อน: <b style="color: #38bdf8;">฿${formatMoney(b.totalPaid)}</b> | ยอดใช้จริง: <b style="color: #cbd5e1;">฿${formatMoney(b.totalShare)}</b>
                                            </span>
                                            ${m.promptPay ? `<span style="font-size: 0.7rem; color: #64748b;">พร้อมเพย์: ${m.promptPay}</span>` : ''}
                                        </div>
                                    </div>
                                    <div class="bs-bal-right">
                                        <span class="bs-bal-net-val" style="color: ${valColor};">
                                            ${b.netBalance > 0 ? '+' : ''}฿${formatMoney(b.netBalance)}
                                        </span>
                                        <span class="bs-member-net ${badgeClass} bs-bal-net-label">${badgeLabel}</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render Analytics & Charts Tab
     */
    function renderAnalyticsTab(group) {
        // Category Totals
        const catTotals = {};
        Object.keys(CATEGORIES).forEach(k => catTotals[k] = 0);
        let grandTotal = 0;

        group.expenses.forEach(e => {
            const amt = Number(e.amount) || 0;
            const k = e.category in CATEGORIES ? e.category : 'other';
            catTotals[k] += amt;
            grandTotal += amt;
        });

        // Payer Totals
        const payerTotals = {};
        group.members.forEach(m => payerTotals[m.id] = 0);
        group.expenses.forEach(e => {
            if (e.payerId in payerTotals) {
                payerTotals[e.payerId] += Number(e.amount) || 0;
            }
        });

        return `
            <div class="bs-settlement-grid">
                <!-- Category Breakdown -->
                <div class="bs-card">
                    <h3 class="bs-card-title" style="margin-bottom: 1.25rem;">
                        <span>🍜</span> สัดส่วนค่าใช้จ่ายตามหมวดหมู่
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        ${Object.keys(CATEGORIES).map(k => {
                            const amt = catTotals[k];
                            const pct = grandTotal > 0 ? ((amt / grandTotal) * 100).toFixed(1) : 0;
                            const cat = CATEGORIES[k];
                            return `
                                <div>
                                    <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.35rem;">
                                        <span style="font-weight: 700; display: flex; align-items: center; gap: 0.4rem;">
                                            <span>${cat.icon}</span> ${cat.label}
                                        </span>
                                        <span><b>฿${formatMoney(amt)}</b> <span style="color: #94a3b8; font-size: 0.78rem;">(${pct}%)</span></span>
                                    </div>
                                    <div style="background: rgba(255,255,255,0.06); height: 8px; border-radius: 99px; overflow: hidden;">
                                        <div style="background: ${cat.color}; width: ${pct}%; height: 100%; border-radius: 99px; transition: width 0.3s;"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Payer Breakdown -->
                <div class="bs-card">
                    <h3 class="bs-card-title" style="margin-bottom: 1.25rem;">
                        <span>💳</span> สัดส่วนการออกเงินให้ก่อน (สายเปย์)
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        ${group.members.map(m => {
                            const amt = payerTotals[m.id] || 0;
                            const pct = grandTotal > 0 ? ((amt / grandTotal) * 100).toFixed(1) : 0;
                            return `
                                <div>
                                    <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.35rem;">
                                        <span style="font-weight: 700; display: flex; align-items: center; gap: 0.4rem;">
                                            <span>${m.avatar || '🧑'}</span> ${m.name}
                                        </span>
                                        <span><b>฿${formatMoney(amt)}</b> <span style="color: #94a3b8; font-size: 0.78rem;">(${pct}%)</span></span>
                                    </div>
                                    <div style="background: rgba(255,255,255,0.06); height: 8px; border-radius: 99px; overflow: hidden;">
                                        <div style="background: ${m.color || '#38bdf8'}; width: ${pct}%; height: 100%; border-radius: 99px; transition: width 0.3s;"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // MODALS & EVENT HANDLERS
    // =========================================================================

    /**
     * Open Expense Modal (Add / Edit)
     */
    function openExpenseModal(expenseId = null) {
        const group = getCurrentGroup();
        if (!group) return;

        editingExpenseId = expenseId;
        let expense = null;
        if (expenseId) {
            expense = group.expenses.find(e => e.id === expenseId);
        }

        const isEdit = !!expense;
        const currentSplitType = expense ? expense.splitType : 'equal';
        const currentCategory = expense ? expense.category : 'food';

        // Prepare overlay
        const overlay = document.createElement('div');
        overlay.className = 'bs-modal-overlay';
        overlay.id = 'bs-expense-modal-overlay';

        overlay.innerHTML = `
            <div class="bs-modal-card">
                <div class="bs-modal-header">
                    <h3><span>${isEdit ? '✏️' : '➕'}</span> ${isEdit ? 'แก้ไขรายการค่าใช้จ่าย' : 'เพิ่มรายการค่าใช้จ่าย'}</h3>
                    <button class="bs-icon-btn btn-modal-close" style="font-size: 1.1rem;">✕</button>
                </div>
                <div class="bs-modal-body">
                    <!-- Title & Quick Tags -->
                    <div class="bs-form-group">
                        <label class="bs-form-label">ชื่อรายการค่าใช้จ่าย *</label>
                        <input type="text" id="bs-input-title" class="bs-input" placeholder="เช่น ค่าหมูกระทะ, ค่าน้ำมัน, ค่ากาแฟ" value="${expense ? expense.title : ''}" required>
                        <div class="bs-quick-tags">
                            <span class="bs-quick-tag" data-fill="ค่าหมูกระทะ 🍲">🍲 หมูกระทะ</span>
                            <span class="bs-quick-tag" data-fill="ค่าบุฟเฟต์/ชาบู 🥩">🥩 บุฟเฟต์/ชาบู</span>
                            <span class="bs-quick-tag" data-fill="ค่าน้ำมันรถ 🚗">🚗 น้ำมัน</span>
                            <span class="bs-quick-tag" data-fill="ค่ากาแฟ & ขนม ☕">☕ คาเฟ่</span>
                            <span class="bs-quick-tag" data-fill="ค่าแท็กซี่ 🚕">🚕 แท็กซี่</span>
                            <span class="bs-quick-tag" data-fill="ค่าที่พัก 🏨">🏨 ที่พัก</span>
                            <span class="bs-quick-tag" data-fill="ของกินเล่น/สแน็ค 🍿">🍿 ขนม</span>
                        </div>
                    </div>

                    <!-- Category Picker -->
                    <div class="bs-form-group">
                        <label class="bs-form-label">หมวดหมู่</label>
                        <div class="bs-category-grid">
                            ${Object.keys(CATEGORIES).map(catKey => `
                                <div class="bs-cat-option ${catKey === currentCategory ? 'selected' : ''}" data-cat="${catKey}">
                                    <span class="bs-cat-option-icon">${CATEGORIES[catKey].icon}</span>
                                    <span class="bs-cat-option-label">${CATEGORIES[catKey].label}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Amount & Date -->
                    <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 1rem;">
                        <div class="bs-form-group">
                            <label class="bs-form-label">ยอดเงินรวม (บาท) *</label>
                            <div class="bs-amount-input-wrap">
                                <span class="bs-amount-currency">฿</span>
                                <input type="number" id="bs-input-amount" class="bs-input bs-amount-input" step="0.01" min="0" placeholder="0.00" value="${expense ? expense.amount : ''}" required>
                            </div>
                        </div>
                        <div class="bs-form-group">
                            <label class="bs-form-label">วันที่ & เวลา</label>
                            <input type="datetime-local" id="bs-input-date" class="bs-input" value="${expense ? expense.date : new Date().toISOString().slice(0, 16)}">
                        </div>
                    </div>

                    <!-- Who paid (Payer) -->
                    <div class="bs-form-group">
                        <label class="bs-form-label">ใครออกเงินให้ก่อน? (คนจ่ายเงิน) *</label>
                        <select id="bs-input-payer" class="bs-select" style="width: 100%;">
                            ${group.members.map(m => `
                                <option value="${m.id}" ${expense && expense.payerId === m.id ? 'selected' : ''}>
                                    ${m.avatar || '🧑'} ${m.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- Split Method Switcher -->
                    <div class="bs-form-group">
                        <label class="bs-form-label">วิธีหารค่าใช้จ่าย</label>
                        <div class="bs-split-method-tabs">
                            <button type="button" class="bs-split-method-btn ${currentSplitType === 'equal' ? 'active' : ''}" data-method="equal">🔀 หารเท่ากัน</button>
                            <button type="button" class="bs-split-method-btn ${currentSplitType === 'exact' ? 'active' : ''}" data-method="exact">🔢 ระบุยอดรายคน</button>
                            <button type="button" class="bs-split-method-btn ${currentSplitType === 'shares' ? 'active' : ''}" data-method="shares">⚖️ ตามสัดส่วน/คน</button>
                        </div>
                    </div>

                    <!-- Dynamic Split Participants Area -->
                    <div id="bs-split-participants-container">
                        <!-- Injected via updateSplitMethodUI() -->
                    </div>

                    <!-- Settled Checkbox & Note -->
                    <div style="display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.03); padding: 0.75rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06);">
                        <input type="checkbox" id="bs-input-settled" class="bs-checkbox" ${expense && expense.settled ? 'checked' : ''}>
                        <label for="bs-input-settled" style="font-size: 0.85rem; font-weight: 700; cursor: pointer; color: #f8fafc;">
                            ทำเครื่องหมายว่าบิลนี้เคลียร์เงินเรียบร้อยแล้ว ✅
                        </label>
                    </div>

                    <div class="bs-form-group">
                        <label class="bs-form-label">หมายเหตุ / โน้ตเพิ่มเติม</label>
                        <input type="text" id="bs-input-note" class="bs-input" placeholder="เช่น บอสไม่ได้กินของหวาน หรือ โอนคืนแล้ว" value="${expense ? (expense.note || '') : ''}">
                    </div>
                </div>
                <div class="bs-modal-footer">
                    <button type="button" class="bs-btn bs-btn-secondary btn-modal-close">ยกเลิก</button>
                    <button type="button" id="bs-btn-save-expense" class="bs-btn bs-btn-primary">บันทึกรายการ</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Bind quick tags
        overlay.querySelectorAll('.bs-quick-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const input = overlay.querySelector('#bs-input-title');
                if (input) {
                    input.value = tag.getAttribute('data-fill');
                    input.focus();
                }
            });
        });

        // Bind Category picker
        overlay.querySelectorAll('.bs-cat-option').forEach(opt => {
            opt.addEventListener('click', () => {
                overlay.querySelectorAll('.bs-cat-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            });
        });

        // Bind Split Method Switcher
        overlay.querySelectorAll('.bs-split-method-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                overlay.querySelectorAll('.bs-split-method-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateSplitMethodUI(group, btn.getAttribute('data-method'), expense);
            });
        });

        // Initial split method render
        updateSplitMethodUI(group, currentSplitType, expense);

        // Amount input listener for live calculations
        const amtInput = overlay.querySelector('#bs-input-amount');
        if (amtInput) {
            amtInput.addEventListener('input', () => {
                const activeMethod = overlay.querySelector('.bs-split-method-btn.active').getAttribute('data-method');
                updateSplitMethodUI(group, activeMethod, expense);
            });
        }

        // Close handlers
        overlay.querySelectorAll('.btn-modal-close').forEach(b => b.addEventListener('click', () => overlay.remove()));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });

        // Save handler
        overlay.querySelector('#bs-btn-save-expense').addEventListener('click', () => {
            saveExpenseForm(group, expense);
        });
    }

    /**
     * Update Participants Split Method Form Sub-view
     */
    function updateSplitMethodUI(group, method, existingExpense) {
        const container = document.getElementById('bs-split-participants-container');
        if (!container) return;

        const amtVal = Number(document.getElementById('bs-input-amount')?.value) || 0;

        if (method === 'equal') {
            const currentSelected = existingExpense && existingExpense.splitType === 'equal' && existingExpense.participants
                ? new Set(existingExpense.participants)
                : new Set(group.members.map(m => m.id));

            container.innerHTML = `
                <div class="bs-participants-box">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                        <span style="font-size: 0.8rem; font-weight: 700; color: #94a3b8;">เลือกคนที่ร่วมหาร:</span>
                        <div style="display: flex; gap: 0.4rem;">
                            <button type="button" id="bs-btn-select-all" class="bs-btn bs-btn-secondary bs-btn-sm" style="padding: 0.15rem 0.45rem; font-size: 0.72rem;">เลือกทุกคน</button>
                            <button type="button" id="bs-btn-select-none" class="bs-btn bs-btn-secondary bs-btn-sm" style="padding: 0.15rem 0.45rem; font-size: 0.72rem;">ยกเลิก</button>
                        </div>
                    </div>
                    ${group.members.map(m => `
                        <div class="bs-participant-row">
                            <label class="bs-participant-left" style="cursor: pointer; width: 100%;">
                                <input type="checkbox" class="bs-checkbox bs-equal-cb" value="${m.id}" ${currentSelected.has(m.id) ? 'checked' : ''}>
                                <span style="font-size: 1.15rem;">${m.avatar || '🧑'}</span>
                                <span style="font-size: 0.88rem; font-weight: 700; color: #f8fafc;">${m.name}</span>
                            </label>
                            <span class="bs-equal-share-preview" data-member-id="${m.id}" style="font-size: 0.85rem; font-weight: 700; color: #34d399; font-family: 'Outfit';">
                                ฿0.00
                            </span>
                        </div>
                    `).join('')}
                    <div id="bs-equal-summary" style="font-size: 0.82rem; color: #38bdf8; font-weight: 700; text-align: right; padding-top: 0.25rem;">
                    </div>
                </div>
            `;

            const recalculateEqual = () => {
                const checked = Array.from(container.querySelectorAll('.bs-equal-cb:checked')).map(cb => cb.value);
                const count = checked.length;
                const each = count > 0 ? (amtVal / count) : 0;
                container.querySelectorAll('.bs-equal-share-preview').forEach(span => {
                    const mId = span.getAttribute('data-member-id');
                    if (checked.includes(mId)) {
                        span.textContent = `฿${formatMoney(each)}`;
                        span.style.color = '#34d399';
                    } else {
                        span.textContent = '-';
                        span.style.color = '#64748b';
                    }
                });
                const summaryEl = document.getElementById('bs-equal-summary');
                if (summaryEl) {
                    summaryEl.textContent = count > 0 ? `หาร ${count} คน = คนละ ฿${formatMoney(each)}` : '⚠️ โปรดเลือกอย่างน้อย 1 คน';
                }
            };

            container.querySelectorAll('.bs-equal-cb').forEach(cb => cb.addEventListener('change', recalculateEqual));
            document.getElementById('bs-btn-select-all')?.addEventListener('click', () => {
                container.querySelectorAll('.bs-equal-cb').forEach(cb => cb.checked = true);
                recalculateEqual();
            });
            document.getElementById('bs-btn-select-none')?.addEventListener('click', () => {
                container.querySelectorAll('.bs-equal-cb').forEach(cb => cb.checked = false);
                recalculateEqual();
            });

            recalculateEqual();
        } else if (method === 'exact') {
            const currentSplits = (existingExpense && existingExpense.splitType === 'exact' && existingExpense.exactSplits) || {};

            container.innerHTML = `
                <div class="bs-participants-box">
                    <span style="font-size: 0.8rem; font-weight: 700; color: #94a3b8; margin-bottom: 0.25rem;">ระบุจำนวนเงินของแต่ละคน:</span>
                    ${group.members.map(m => `
                        <div class="bs-participant-row">
                            <div class="bs-participant-left">
                                <span style="font-size: 1.15rem;">${m.avatar || '🧑'}</span>
                                <span style="font-size: 0.88rem; font-weight: 700; color: #f8fafc;">${m.name}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.35rem;">
                                <span style="font-size: 0.8rem; color: #94a3b8;">฿</span>
                                <input type="number" class="bs-custom-split-input bs-exact-input" data-member-id="${m.id}" step="0.01" min="0" placeholder="0.00" value="${currentSplits[m.id] || ''}">
                            </div>
                        </div>
                    `).join('')}
                    <div id="bs-exact-balance-bar" class="bs-split-balance-bar">
                    </div>
                </div>
            `;

            const recalculateExact = () => {
                let currentSum = 0;
                container.querySelectorAll('.bs-exact-input').forEach(input => {
                    currentSum += Number(input.value) || 0;
                });
                const diff = Math.round((amtVal - currentSum) * 100) / 100;
                const bar = document.getElementById('bs-exact-balance-bar');
                if (!bar) return;

                if (Math.abs(diff) < 0.01) {
                    bar.className = 'bs-split-balance-bar balance-valid';
                    bar.innerHTML = `<span>✅ ยอดรวมตรงกับบิลพอดี</span><span>฿${formatMoney(currentSum)} / ฿${formatMoney(amtVal)}</span>`;
                } else if (diff > 0) {
                    bar.className = 'bs-split-balance-bar balance-invalid';
                    bar.innerHTML = `<span>⚠️ ยังขาดอีก ฿${formatMoney(diff)}</span><span>฿${formatMoney(currentSum)} / ฿${formatMoney(amtVal)}</span>`;
                } else {
                    bar.className = 'bs-split-balance-bar balance-invalid';
                    bar.innerHTML = `<span>⚠️ ยอดเกินมา ฿${formatMoney(Math.abs(diff))}</span><span>฿${formatMoney(currentSum)} / ฿${formatMoney(amtVal)}</span>`;
                }
            };

            container.querySelectorAll('.bs-exact-input').forEach(i => i.addEventListener('input', recalculateExact));
            recalculateExact();
        } else if (method === 'shares') {
            const currentShares = (existingExpense && existingExpense.splitType === 'shares' && existingExpense.sharesSplits) || {};

            container.innerHTML = `
                <div class="bs-participants-box">
                    <span style="font-size: 0.8rem; font-weight: 700; color: #94a3b8; margin-bottom: 0.25rem;">ระบุจำนวนส่วน (เช่น มา 2 คนใส่ 2, ไม่ได้กินใส่ 0):</span>
                    ${group.members.map(m => `
                        <div class="bs-participant-row">
                            <div class="bs-participant-left">
                                <span style="font-size: 1.15rem;">${m.avatar || '🧑'}</span>
                                <span style="font-size: 0.88rem; font-weight: 700; color: #f8fafc;">${m.name}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.45rem;">
                                <input type="number" class="bs-custom-split-input bs-shares-input" data-member-id="${m.id}" step="0.5" min="0" value="${currentShares[m.id] !== undefined ? currentShares[m.id] : 1}" style="width: 70px;">
                                <span style="font-size: 0.75rem; color: #94a3b8;">ส่วน</span>
                                <span class="bs-shares-share-preview" data-member-id="${m.id}" style="font-size: 0.82rem; font-weight: 700; color: #34d399; font-family: 'Outfit'; min-width: 65px; text-align: right;">฿0.00</span>
                            </div>
                        </div>
                    `).join('')}
                    <div id="bs-shares-summary" style="font-size: 0.82rem; color: #38bdf8; font-weight: 700; text-align: right; padding-top: 0.25rem;">
                    </div>
                </div>
            `;

            const recalculateShares = () => {
                let totalShares = 0;
                container.querySelectorAll('.bs-shares-input').forEach(input => {
                    totalShares += Number(input.value) || 0;
                });

                container.querySelectorAll('.bs-shares-share-preview').forEach(span => {
                    const mId = span.getAttribute('data-member-id');
                    const input = container.querySelector(`.bs-shares-input[data-member-id="${mId}"]`);
                    const s = Number(input?.value) || 0;
                    if (totalShares > 0 && s > 0) {
                        const calculated = (amtVal * (s / totalShares));
                        span.textContent = `฿${formatMoney(calculated)}`;
                        span.style.color = '#34d399';
                    } else {
                        span.textContent = '-';
                        span.style.color = '#64748b';
                    }
                });

                const summaryEl = document.getElementById('bs-shares-summary');
                if (summaryEl) {
                    summaryEl.textContent = totalShares > 0 ? `รวม ${totalShares} ส่วน (ส่วนละ ฿${formatMoney(amtVal / totalShares)})` : '⚠️ โปรดใส่อย่างน้อย 1 ส่วน';
                }
            };

            container.querySelectorAll('.bs-shares-input').forEach(i => i.addEventListener('input', recalculateShares));
            recalculateShares();
        }
    }

    /**
     * Save Expense Form Handler
     */
    function saveExpenseForm(group, existingExpense) {
        const title = document.getElementById('bs-input-title')?.value.trim();
        const amount = Number(document.getElementById('bs-input-amount')?.value) || 0;
        const date = document.getElementById('bs-input-date')?.value;
        const payerId = document.getElementById('bs-input-payer')?.value;
        const settled = document.getElementById('bs-input-settled')?.checked || false;
        const note = document.getElementById('bs-input-note')?.value.trim() || '';

        const selectedCatEl = document.querySelector('.bs-cat-option.selected');
        const category = selectedCatEl ? selectedCatEl.getAttribute('data-cat') : 'food';

        const activeMethodEl = document.querySelector('.bs-split-method-btn.active');
        const splitType = activeMethodEl ? activeMethodEl.getAttribute('data-method') : 'equal';

        if (!title) {
            alert('โปรดระบุชื่อรายการค่าใช้จ่าย');
            document.getElementById('bs-input-title')?.focus();
            return;
        }

        if (amount <= 0) {
            alert('โปรดระบุจำนวนเงินที่ถูกต้อง');
            document.getElementById('bs-input-amount')?.focus();
            return;
        }

        let participants = [];
        let exactSplits = {};
        let sharesSplits = {};

        if (splitType === 'equal') {
            participants = Array.from(document.querySelectorAll('.bs-equal-cb:checked')).map(cb => cb.value);
            if (participants.length === 0) {
                alert('โปรดเลือกผู้ร่วมหารอย่างน้อย 1 คน');
                return;
            }
        } else if (splitType === 'exact') {
            let totalExact = 0;
            document.querySelectorAll('.bs-exact-input').forEach(i => {
                const val = Number(i.value) || 0;
                if (val > 0) {
                    exactSplits[i.getAttribute('data-member-id')] = val;
                    totalExact += val;
                }
            });
            if (Math.abs(totalExact - amount) > 0.05) {
                alert(`ยอดรวมที่ระบุรายคน (฿${formatMoney(totalExact)}) ไม่ตรงกับยอดเงินรวม (฿${formatMoney(amount)}) โปรดปรับให้เท่ากัน`);
                return;
            }
        } else if (splitType === 'shares') {
            let totalShares = 0;
            document.querySelectorAll('.bs-shares-input').forEach(i => {
                const val = Number(i.value) || 0;
                if (val > 0) {
                    sharesSplits[i.getAttribute('data-member-id')] = val;
                    totalShares += val;
                }
            });
            if (totalShares <= 0) {
                alert('โปรดระบุสัดส่วนอย่างน้อย 1 คน');
                return;
            }
        }

        if (existingExpense) {
            // Edit existing
            existingExpense.title = title;
            existingExpense.amount = amount;
            existingExpense.date = date;
            existingExpense.payerId = payerId;
            existingExpense.category = category;
            existingExpense.splitType = splitType;
            existingExpense.participants = participants;
            existingExpense.exactSplits = exactSplits;
            existingExpense.sharesSplits = sharesSplits;
            existingExpense.settled = settled;
            existingExpense.note = note;
            showToast(`แก้ไขรายการ "${title}" เรียบร้อย`);
        } else {
            // Add new
            const newExp = {
                id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                title,
                amount,
                date: date || new Date().toISOString().slice(0, 16),
                payerId,
                category,
                splitType,
                participants,
                exactSplits,
                sharesSplits,
                settled,
                note,
                createdAt: Date.now()
            };
            group.expenses.unshift(newExp);
            showToast(`บันทึกรายการ "${title}" (฿${formatMoney(amount)}) เรียบร้อย`);
        }

        saveData();
        document.getElementById('bs-expense-modal-overlay')?.remove();
        render();
    }

    /**
     * Open Member Modal (Add / Edit)
     */
    function openMemberModal(memberId = null) {
        const group = getCurrentGroup();
        if (!group) return;

        const isEdit = !!memberId;
        const member = isEdit ? group.members.find(m => m.id === memberId) : null;

        const emojis = ['🧑', '👩', '🧔', '👧', '👨‍🦱', '👩‍🦰', '🕶️', '🐱', '🐶', '🦊', '🐼', '🦁', '⭐', '🔥'];
        const colors = ['#38bdf8', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#6366f1'];

        const overlay = document.createElement('div');
        overlay.className = 'bs-modal-overlay';
        overlay.id = 'bs-member-modal-overlay';

        overlay.innerHTML = `
            <div class="bs-modal-card" style="max-width: 440px;">
                <div class="bs-modal-header">
                    <h3><span>${isEdit ? '✏️' : '➕'}</span> ${isEdit ? 'แก้ไขข้อมูลสมาชิก' : 'เพิ่มสมาชิกใหม่'}</h3>
                    <button class="bs-icon-btn btn-modal-close">✕</button>
                </div>
                <div class="bs-modal-body">
                    <div class="bs-form-group">
                        <label class="bs-form-label">ชื่อสมาชิก *</label>
                        <input type="text" id="bs-member-input-name" class="bs-input" placeholder="เช่น ตูน, บอส, เจน" value="${member ? member.name : ''}" required>
                    </div>

                    <div class="bs-form-group">
                        <label class="bs-form-label">เบอร์พร้อมเพย์ หรือ เลขบัญชี (สำหรับให้เพื่อนสแกนโอน)</label>
                        <input type="text" id="bs-member-input-pp" class="bs-input" placeholder="เช่น 0812345678" value="${member ? (member.promptPay || '') : ''}">
                    </div>

                    <div class="bs-form-group">
                        <label class="bs-form-label">เลือกรูปโปรไฟล์ / อิโมจิ</label>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            ${emojis.map(e => `
                                <span class="bs-avatar-option" data-emoji="${e}" style="cursor: pointer; font-size: 1.4rem; padding: 0.35rem; border-radius: 10px; background: rgba(255,255,255,0.06); ${member && member.avatar === e ? 'border: 2px solid #10b981;' : ''}">
                                    ${e}
                                </span>
                            `).join('')}
                        </div>
                    </div>

                    <div class="bs-form-group">
                        <label class="bs-form-label">เลือกสีประจำตัว</label>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            ${colors.map(c => `
                                <span class="bs-color-option" data-color="${c}" style="cursor: pointer; width: 28px; height: 28px; border-radius: 50%; background: ${c}; ${member && member.color === c ? 'outline: 3px solid #fff;' : ''}"></span>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="bs-modal-footer">
                    ${isEdit ? `<button type="button" id="bs-btn-delete-member" class="bs-btn bs-btn-danger bs-btn-sm" style="margin-right: auto;">ลบสมาชิก</button>` : ''}
                    <button type="button" class="bs-btn bs-btn-secondary btn-modal-close">ยกเลิก</button>
                    <button type="button" id="bs-btn-save-member" class="bs-btn bs-btn-primary">บันทึก</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        let selectedAvatar = member ? member.avatar : '🧑';
        let selectedColor = member ? member.color : '#38bdf8';

        overlay.querySelectorAll('.bs-avatar-option').forEach(opt => {
            opt.addEventListener('click', () => {
                overlay.querySelectorAll('.bs-avatar-option').forEach(o => o.style.border = 'none');
                opt.style.border = '2px solid #10b981';
                selectedAvatar = opt.getAttribute('data-emoji');
            });
        });

        overlay.querySelectorAll('.bs-color-option').forEach(opt => {
            opt.addEventListener('click', () => {
                overlay.querySelectorAll('.bs-color-option').forEach(o => o.style.outline = 'none');
                opt.style.outline = '3px solid #fff';
                selectedColor = opt.getAttribute('data-color');
            });
        });

        // Close
        overlay.querySelectorAll('.btn-modal-close').forEach(b => b.addEventListener('click', () => overlay.remove()));

        // Delete
        overlay.querySelector('#bs-btn-delete-member')?.addEventListener('click', () => {
            if (confirm(`คุณต้องการลบ "${member.name}" ออกจากกลุ่มใช่หรือไม่?`)) {
                group.members = group.members.filter(m => m.id !== member.id);
                saveData();
                overlay.remove();
                showToast(`ลบสมาชิก "${member.name}" แล้ว`);
                render();
            }
        });

        // Save
        overlay.querySelector('#bs-btn-save-member').addEventListener('click', () => {
            const name = document.getElementById('bs-member-input-name')?.value.trim();
            const promptPay = document.getElementById('bs-member-input-pp')?.value.trim() || '';

            if (!name) {
                alert('โปรดระบุชื่อสมาชิก');
                document.getElementById('bs-member-input-name')?.focus();
                return;
            }

            if (isEdit) {
                member.name = name;
                member.promptPay = promptPay;
                member.avatar = selectedAvatar;
                member.color = selectedColor;
                showToast(`อัปเดตข้อมูล "${name}" เรียบร้อย`);
            } else {
                group.members.push({
                    id: 'm_' + Date.now(),
                    name,
                    promptPay,
                    avatar: selectedAvatar,
                    color: selectedColor
                });
                showToast(`เพิ่มสมาชิก "${name}" แล้ว`);
            }

            saveData();
            overlay.remove();
            render();
        });
    }

    /**
     * Show PromptPay QR Code Modal
     */
    function showPromptPayModal(payeeName, promptPayNumber, amount, fromName) {
        if (!promptPayNumber) {
            const inputNum = prompt(`ยังไม่มีเบอร์พร้อมเพย์ของ "${payeeName}"\nโปรดระบุเบอร์โทรศัพท์ (10 หลัก) หรือเลขบัตรประชาชน (13 หลัก):`);
            if (!inputNum) return;
            promptPayNumber = inputNum.trim();
            // Save to member profile
            const group = getCurrentGroup();
            const m = group.members.find(x => x.name === payeeName);
            if (m) {
                m.promptPay = promptPayNumber;
                saveData();
            }
        }

        const payload = generatePromptPayPayload(promptPayNumber, amount);
        if (!payload) {
            alert('ไม่สามารถสร้าง QR Code ได้ เนื่องจากเบอร์พร้อมเพย์ไม่ถูกต้อง');
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'bs-modal-overlay';
        overlay.id = 'bs-qr-modal-overlay';

        overlay.innerHTML = `
            <div class="bs-modal-card" style="max-width: 400px; background: #fff; color: #0f172a;">
                <div class="bs-modal-header" style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <h3 style="color: #0f172a;"><span>📲</span> สแกนจ่ายพร้อมเพย์</h3>
                    <button class="bs-icon-btn btn-modal-close" style="color: #64748b;">✕</button>
                </div>
                <div class="bs-modal-body" style="align-items: center; text-align: center;">
                    <div class="bs-promptpay-logo-bar">
                        <span style="font-size: 1.4rem;">💳</span>
                        <span class="bs-promptpay-logo-text">PROMPTPAY</span>
                    </div>

                    <div class="bs-qr-canvas-box">
                        <canvas id="bs-pp-canvas" style="width: 220px; height: 220px;"></canvas>
                    </div>

                    <div class="bs-qr-amount-badge">
                        ฿${formatMoney(amount)}
                    </div>

                    <div class="bs-qr-info">
                        <span class="bs-qr-payee">โอนให้: ${payeeName}</span>
                        <span class="bs-qr-pp-num">พร้อมเพย์: ${promptPayNumber}</span>
                        ${fromName ? `<span style="font-size: 0.78rem; color: #64748b; margin-top: 0.2rem;">(ผู้โอน: ${fromName})</span>` : ''}
                    </div>

                    <div style="display: flex; gap: 0.5rem; width: 100%; margin-top: 0.5rem;">
                        <button id="bs-btn-copy-pp" class="bs-btn bs-btn-secondary" style="flex: 1; color: #0f172a; border-color: #cbd5e1; background: #f1f5f9; font-size: 0.8rem;">
                            📋 คัดลอกเบอร์
                        </button>
                        <button id="bs-btn-done-transfer" class="bs-btn bs-btn-primary" style="flex: 1; font-size: 0.8rem;">
                            ✅ บันทึกว่าโอนแล้ว
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const canvas = overlay.querySelector('#bs-pp-canvas');
        renderQrCodeToCanvas(canvas, payload, 220);

        // Copy number button
        overlay.querySelector('#bs-btn-copy-pp').addEventListener('click', () => {
            navigator.clipboard.writeText(promptPayNumber);
            showToast(`คัดลอกเบอร์พร้อมเพย์ "${promptPayNumber}" แล้ว`);
        });

        // Done button
        overlay.querySelector('#bs-btn-done-transfer').addEventListener('click', () => {
            showToast(`บันทึกการโอนเงิน ฿${formatMoney(amount)} ให้ "${payeeName}" เรียบร้อย 🎉`);
            overlay.remove();
        });

        // Close
        overlay.querySelectorAll('.btn-modal-close').forEach(b => b.addEventListener('click', () => overlay.remove()));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }

    /**
     * Copy Summary to LINE Clipboard Modal
     */
    function copyLineSummary() {
        const group = getCurrentGroup();
        if (!group) return;

        const { memberBalances, transfers } = calculateSmartSettlement(group, true);
        const totalExpenses = group.expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const unsettledExpenses = group.expenses.filter(e => !e.settled);
        const unsettledTotal = unsettledExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        let text = `📋 สรุปค่าใช้จ่าย: ${group.name}\n`;
        text += `━━━━━━━━━━━━━━━━━━━\n`;
        text += `💰 ยอดรวมทั้งหมด: ฿${formatMoney(totalExpenses)}\n`;
        text += `⏳ ยอดที่ยังค้างเคลียร์: ฿${formatMoney(unsettledTotal)} (${unsettledExpenses.length} บิล)\n\n`;

        text += `👥 ยอดสุทธิรายบุคคล:\n`;
        group.members.forEach(m => {
            const b = memberBalances[m.id] || { totalPaid: 0, totalShare: 0, netBalance: 0 };
            let statusStr = '';
            if (b.netBalance > 0.01) statusStr = `➡️ ต้องได้คืน +฿${formatMoney(b.netBalance)}`;
            else if (b.netBalance < -0.01) statusStr = `➡️ ต้องจ่าย -฿${formatMoney(Math.abs(b.netBalance))}`;
            else statusStr = `➡️ เคลียร์ครบพอดี (฿0)`;
            text += `• ${m.name}: ออกไป ฿${formatMoney(b.totalPaid)} | ใช้จริง ฿${formatMoney(b.totalShare)} ${statusStr}\n`;
        });

        text += `\n💸 สรุปการโอนเคลียร์หนี้ (ตัดทอนน้อยครั้งที่สุด):\n`;
        if (transfers.length === 0) {
            text += `🎉 เคลียร์ครบหมดแล้ว ไม่มีหนี้ค้าง!\n`;
        } else {
            transfers.forEach((t, i) => {
                const ppInfo = t.toMember.promptPay ? ` (พร้อมเพย์: ${t.toMember.promptPay})` : '';
                text += `${i + 1}. ${t.fromMember.name} ➡️ โอนให้ ${t.toMember.name}: ฿${formatMoney(t.amount)}${ppInfo}\n`;
            });
        }

        if (unsettledExpenses.length > 0) {
            text += `\n🧾 รายการบิลที่รอเคลียร์:\n`;
            unsettledExpenses.forEach((e, i) => {
                const payer = group.members.find(x => x.id === e.payerId);
                const pName = payer ? payer.name : 'ไม่ระบุ';
                text += `${i + 1}. ${e.title}: ฿${formatMoney(e.amount)} (${pName} จ่าย)\n`;
            });
        }

        text += `━━━━━━━━━━━━━━━━━━━\n`;
        text += `สร้างจาก My Playground Bill Splitter 💸`;

        // Copy to clipboard
        try {
            navigator.clipboard.writeText(text);
            showToast('📋 คัดลอกสรุปรายการสำหรับส่ง LINE เรียบร้อยแล้ว!');
        } catch (e) {
            console.error('Clipboard copy failed:', e);
        }

        // Show preview modal as well
        const overlay = document.createElement('div');
        overlay.className = 'bs-modal-overlay';
        overlay.innerHTML = `
            <div class="bs-modal-card" style="max-width: 500px;">
                <div class="bs-modal-header">
                    <h3><span>📋</span> ข้อความสรุปสำหรับส่ง LINE</h3>
                    <button class="bs-icon-btn btn-modal-close">✕</button>
                </div>
                <div class="bs-modal-body">
                    <p style="font-size: 0.85rem; color: #a7f3d0; margin: 0;">
                        ✅ คัดลอกลง Clipboard แล้ว! คุณสามารถเปิดแชท LINE แล้วกด Paste ได้ทันที หรือคัดลอกจากกล่องด้านล่าง:
                    </p>
                    <div class="bs-line-preview">${text}</div>
                </div>
                <div class="bs-modal-footer">
                    <button type="button" class="bs-btn bs-btn-line btn-copy-again">📋 คัดลอกอีกครั้ง</button>
                    <button type="button" class="bs-btn bs-btn-primary btn-modal-close">ปิด</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('.btn-copy-again').addEventListener('click', () => {
            navigator.clipboard.writeText(text);
            showToast('คัดลอกข้อความซ้ำอีกครั้งแล้ว');
        });

        overlay.querySelectorAll('.btn-modal-close').forEach(b => b.addEventListener('click', () => overlay.remove()));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }

    /**
     * Bind Main Dynamic Event Handlers
     */
    function bindEvents() {
        // Group Switcher
        document.getElementById('bs-group-select')?.addEventListener('change', (e) => {
            appState.currentGroupId = e.target.value;
            saveData();
            render();
        });

        // New Group
        document.getElementById('bs-btn-new-group')?.addEventListener('click', () => {
            const name = prompt('ตั้งชื่อกลุ่มหรือทริปใหม่ เช่น "ทริปหัวหิน 🌊" หรือ "กินบุฟเฟต์วันศุกร์ 🥩":');
            if (!name || !name.trim()) return;

            const newGroupId = 'group_' + Date.now();
            const currentGroup = getCurrentGroup();
            const clonedMembers = currentGroup ? JSON.parse(JSON.stringify(currentGroup.members)) : DEFAULT_DATA.groups[0].members;

            appState.groups.push({
                id: newGroupId,
                name: name.trim(),
                createdAt: Date.now(),
                currency: 'THB',
                members: clonedMembers,
                expenses: [],
                settlementLogs: []
            });

            appState.currentGroupId = newGroupId;
            saveData();
            showToast(`สร้างกลุ่ม "${name.trim()}" สำเร็จ!`);
            render();
        });

        // Edit Group
        document.getElementById('bs-btn-edit-group')?.addEventListener('click', () => {
            const group = getCurrentGroup();
            if (!group) return;
            const newName = prompt('แก้ไขชื่อกลุ่ม:', group.name);
            if (newName && newName.trim()) {
                group.name = newName.trim();
                saveData();
                showToast(`เปลี่ยนชื่อกลุ่มเป็น "${group.name}" แล้ว`);
                render();
            }
        });

        // Delete Group
        document.getElementById('bs-btn-del-group')?.addEventListener('click', () => {
            if (appState.groups.length <= 1) {
                alert('ต้องมีอย่างน้อย 1 กลุ่มในระบบ');
                return;
            }
            const group = getCurrentGroup();
            if (confirm(`คุณต้องการลบกลุ่ม "${group.name}" และรายการค่าใช้จ่ายทั้งหมดในกลุ่มนี้ใช่หรือไม่?`)) {
                appState.groups = appState.groups.filter(g => g.id !== group.id);
                appState.currentGroupId = appState.groups[0].id;
                saveData();
                showToast('ลบกลุ่มเรียบร้อย');
                render();
            }
        });

        // Export Data
        document.getElementById('bs-btn-export-data')?.addEventListener('click', () => {
            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appState, null, 2));
            const dlAnchor = document.createElement('a');
            dlAnchor.setAttribute('href', dataStr);
            dlAnchor.setAttribute('download', `billsplit_backup_${new Date().toISOString().slice(0, 10)}.json`);
            dlAnchor.click();
            dlAnchor.remove();
            showToast('ส่งออกไฟล์ข้อมูลสำรองเรียบร้อย');
        });

        // Import Data
        document.getElementById('bs-btn-import-data')?.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const parsed = JSON.parse(event.target.result);
                        if (parsed.groups && Array.isArray(parsed.groups)) {
                            appState = parsed;
                            saveData();
                            showToast('นำเข้าข้อมูลสำเร็จ!');
                            render();
                        } else {
                            alert('รูปแบบไฟล์ข้อมูลไม่ถูกต้อง');
                        }
                    } catch (err) {
                        alert('ไม่สามารถอ่านไฟล์ JSON ได้: ' + err.message);
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        });

        // Add Member Button
        document.getElementById('bs-btn-add-member')?.addEventListener('click', () => openMemberModal(null));

        // Member Pills (Filter by member)
        document.querySelectorAll('.bs-member-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                filterMemberId = pill.getAttribute('data-member-id');
                render();
            });
        });

        // Tab Switching
        document.querySelectorAll('.bs-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                activeTab = btn.getAttribute('data-tab');
                render();
            });
        });

        // Status Filter Pills
        document.querySelectorAll('[data-filter-status]').forEach(pill => {
            pill.addEventListener('click', () => {
                filterStatus = pill.getAttribute('data-filter-status');
                render();
            });
        });

        // Category Filter Pills
        document.querySelectorAll('[data-filter-category]').forEach(pill => {
            pill.addEventListener('click', () => {
                filterCategory = pill.getAttribute('data-filter-category');
                render();
            });
        });

        // Search Input
        const searchInput = document.getElementById('bs-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value;
                // re-render expenses sub-content directly to keep focus
                const group = getCurrentGroup();
                const tabContent = document.getElementById('bs-tab-content');
                if (tabContent && group && activeTab === 'expenses') {
                    tabContent.innerHTML = renderExpensesTab(group);
                    bindExpensesCardEvents();
                    // restore focus & cursor
                    const newSearch = document.getElementById('bs-search-input');
                    if (newSearch) {
                        newSearch.focus();
                        newSearch.setSelectionRange(newSearch.value.length, newSearch.value.length);
                    }
                }
            });
        }

        // Add Expense Buttons
        document.getElementById('bs-btn-add-expense')?.addEventListener('click', () => openExpenseModal(null));
        document.getElementById('bs-empty-add-btn')?.addEventListener('click', () => openExpenseModal(null));

        // Toggle all settled
        document.getElementById('bs-btn-toggle-all-settled')?.addEventListener('click', () => {
            const group = getCurrentGroup();
            if (!group || !group.expenses.length) return;
            const hasUnsettled = group.expenses.some(e => !e.settled);
            const nextStatus = hasUnsettled; // if any unsettled, mark all settled, else mark all unsettled
            group.expenses.forEach(e => e.settled = nextStatus);
            saveData();
            showToast(nextStatus ? 'ทำเครื่องหมายว่าเคลียร์ครบทุกบิลแล้ว ✅' : 'รีเซ็ตสถานะเป็นรอเคลียร์ทั้งหมด ⏳');
            render();
        });

        // Share to LINE Buttons
        document.getElementById('bs-btn-line-share')?.addEventListener('click', copyLineSummary);
        document.getElementById('bs-btn-line-share-2')?.addEventListener('click', copyLineSummary);

        // Bind Expense Cards & Settlement Actions
        bindExpensesCardEvents();
        bindSettlementActions();
    }

    /**
     * Bind Expense Cards Specific Events
     */
    function bindExpensesCardEvents() {
        const group = getCurrentGroup();
        if (!group) return;

        // Toggle Single Settle
        document.querySelectorAll('.btn-settle-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const expId = btn.getAttribute('data-expense-id');
                const exp = group.expenses.find(x => x.id === expId);
                if (exp) {
                    exp.settled = !exp.settled;
                    saveData();
                    showToast(exp.settled ? `บิล "${exp.title}" เคลียร์แล้ว ✅` : `บิล "${exp.title}" เปลี่ยนเป็นรอเคลียร์ ⏳`);
                    render();
                }
            });
        });

        // Edit Expense
        document.querySelectorAll('.btn-edit-expense').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const expId = btn.getAttribute('data-expense-id');
                openExpenseModal(expId);
            });
        });

        // Delete Expense
        document.querySelectorAll('.btn-delete-expense').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const expId = btn.getAttribute('data-expense-id');
                const exp = group.expenses.find(x => x.id === expId);
                if (exp && confirm(`คุณต้องการลบรายการ "${exp.title}" (฿${formatMoney(exp.amount)}) ใช่หรือไม่?`)) {
                    group.expenses = group.expenses.filter(x => x.id !== expId);
                    saveData();
                    showToast(`ลบรายการ "${exp.title}" แล้ว`);
                    render();
                }
            });
        });
    }

    /**
     * Bind Settlement Transfer Actions
     */
    function bindSettlementActions() {
        // Show PromptPay QR
        document.querySelectorAll('.btn-show-qr').forEach(btn => {
            btn.addEventListener('click', () => {
                const toName = btn.getAttribute('data-to-name');
                const toPp = btn.getAttribute('data-to-pp');
                const amt = Number(btn.getAttribute('data-amt')) || 0;
                const fromName = btn.getAttribute('data-from-name');
                showPromptPayModal(toName, toPp, amt, fromName);
            });
        });

        // Mark Transfer Settled
        document.querySelectorAll('.btn-mark-transfer-settled').forEach(btn => {
            btn.addEventListener('click', () => {
                const fromId = btn.getAttribute('data-from-id');
                const toId = btn.getAttribute('data-to-id');
                const amt = Number(btn.getAttribute('data-amt')) || 0;
                const group = getCurrentGroup();
                if (!group) return;

                const fromM = group.members.find(x => x.id === fromId);
                const toM = group.members.find(x => x.id === toId);

                // Option: Mark expenses involving this debt as settled or prompt confirmation
                if (confirm(`ยืนยันว่า ${fromM ? fromM.name : 'ผู้โอน'} ได้โอนเงิน ฿${formatMoney(amt)} ให้ ${toM ? toM.name : 'ผู้รับ'} เรียบร้อยแล้ว?`)) {
                    // Mark unsettled expenses as settled
                    group.expenses.forEach(e => e.settled = true);
                    saveData();
                    showToast(`บันทึกการโอน ฿${formatMoney(amt)} เรียบร้อย 🎉`);
                    render();
                }
            });
        });
    }

    // =========================================================================
    // INITIALIZATION & GLOBAL EXPORT
    // =========================================================================

    /**
     * Mount Bill Split Page (called when navigating to 'billsplit' view)
     */
    window.initBillSplitPage = function () {
        loadData();
        render();
    };

    // Auto-init if container exists
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('billsplit-app-root')) {
            window.initBillSplitPage();
        }
    });

})();

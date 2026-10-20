/**
 * =========================================================================
 * SMART OPERATIONS PORTAL (ระบบจัดการงานองค์กรยุคใหม่ / ทดแทน SAP)
 * Next-Gen Enterprise Plant Operations, Maintenance (PM), Materials (MM) & Workflow
 * Designed for High-Performance Power Plants (HRSG / Mae Moh) & Industrial Operations
 * =========================================================================
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'myplayground_smartops_data_v1';

    // Master Equipments & Functional Locations (Plant Engineering)
    const MASTER_EQUIPMENTS = [
        { id: 'HRSG-BFP-01', name: 'Boiler Feed Pump A (ปั๊มน้ำป้อนหม้อต้ม A)', area: 'HRSG Unit 1', system: 'Feedwater', criticality: 'Critical' },
        { id: 'HRSG-BFP-02', name: 'Boiler Feed Pump B (ปั๊มน้ำป้อนหม้อต้ม B - Standby)', area: 'HRSG Unit 1', system: 'Feedwater', criticality: 'Critical' },
        { id: 'GT-ROTOR-02', name: 'Gas Turbine #2 Rotor & Casing (กังหันก๊าซชุดที่ 2)', area: 'Power Block 2', system: 'Gas Turbine', criticality: 'Critical' },
        { id: 'ST-GEN-01', name: 'Steam Turbine Generator 1 (เครื่องกำเนิดไฟฟ้ากังหันไอน้ำ)', area: 'Power Block 1', system: 'Steam Turbine', criticality: 'High' },
        { id: 'FGD-ABS-01', name: 'Wet FGD Absorber Tower #1 (หอดูดซับ SO2 แม่เมาะ)', area: 'FGD Plant Unit 8', system: 'Desulfurization', criticality: 'High' },
        { id: 'FGD-OXP-03', name: 'Oxidation Air Blower #3 (โบลเวอร์เติมอากาศ)', area: 'FGD Plant Unit 8', system: 'Air & Slurry', criticality: 'Medium' },
        { id: 'CW-PUMP-04', name: 'Main Cooling Water Pump 4 (ปั๊มน้ำหล่อเย็นหลัก)', area: 'Cooling Water Bay', system: 'Circulation', criticality: 'High' },
        { id: 'GEN-TRANS-01', name: 'Main Step-Up Transformer 500kV (หม้อแปลงหลัก)', area: 'Switchyard 500kV', system: 'Electrical', criticality: 'Critical' }
    ];

    // Master Spare Parts & Materials Catalog (Warehouse MM)
    const MASTER_MATERIALS = [
        {
            matNo: 'MAT-100293',
            name: 'Mechanical Seal Cartridge Type (BFP-A)',
            category: 'pumps',
            spec: 'Single Cartridge, SiC/SiC/Viton, Shaft 85mm, 40 Bar',
            unit: 'ชุด (Set)',
            price: 38500,
            stock: 4,
            minStock: 2,
            maxStock: 8,
            bin: 'WH1-RACK-A02',
            sapTcode: 'MMBE',
            leadTimeDays: 14,
            imageEmoji: '⚙️'
        },
        {
            matNo: 'MAT-100412',
            name: 'High-Temp Gasket Spiral Wound 6" 300#',
            category: 'seals',
            spec: 'SS316L / Flexible Graphite Filler, Class 300 RF',
            unit: 'แผ่น (Pcs)',
            price: 1450,
            stock: 28,
            minStock: 10,
            maxStock: 50,
            bin: 'WH1-SHELF-B11',
            sapTcode: 'MMBE',
            leadTimeDays: 3,
            imageEmoji: '⭕'
        },
        {
            matNo: 'MAT-100588',
            name: 'SKF Spherical Roller Bearing 22220-E1',
            category: 'bearings',
            spec: 'Bore 100mm, OD 180mm, Width 46mm, C3 Clearance',
            unit: 'ตลับ (Pcs)',
            price: 14200,
            stock: 1,
            minStock: 4,
            maxStock: 10,
            bin: 'WH2-RACK-C05',
            sapTcode: 'MMBE',
            leadTimeDays: 7,
            imageEmoji: '🔘'
        },
        {
            matNo: 'MAT-100645',
            name: 'Pressure Transmitter 4-20mA HART (Rosemount 3051)',
            category: 'electrical',
            spec: 'Range 0-100 Bar, Coplanar, SS316 Diaphragm, Ex d IIC',
            unit: 'ตัว (Unit)',
            price: 42000,
            stock: 6,
            minStock: 3,
            maxStock: 12,
            bin: 'WH3-INST-D01',
            sapTcode: 'MMBE',
            leadTimeDays: 21,
            imageEmoji: '📡'
        },
        {
            matNo: 'MAT-100790',
            name: 'Turbine Synthetic Lube Oil ISO VG 46 (200L Drum)',
            category: 'lubricants',
            spec: 'Fully Synthetic Gas & Steam Turbine Oil, ASTM D4304',
            unit: 'ถัง (Drum)',
            price: 52000,
            stock: 2,
            minStock: 5,
            maxStock: 15,
            bin: 'OIL-YARD-02',
            sapTcode: 'MMBE',
            leadTimeDays: 5,
            imageEmoji: '🛢️'
        },
        {
            matNo: 'MAT-100811',
            name: 'SiC Spray Nozzle (หอดูดซับ SO2 Wet FGD)',
            category: 'pumps',
            spec: 'Hollow Cone 90 deg, Reaction Bonded Silicon Carbide',
            unit: 'หัว (Pcs)',
            price: 18900,
            stock: 15,
            minStock: 8,
            maxStock: 30,
            bin: 'WH2-FGD-E08',
            sapTcode: 'MMBE',
            leadTimeDays: 10,
            imageEmoji: '🚿'
        },
        {
            matNo: 'MAT-100902',
            name: 'Solenoid Valve 24VDC 1/2" Ex-Proof (ASCO)',
            category: 'electrical',
            spec: 'Brass Body, 2/2 Way N.C., Zone 1 Atex Certified',
            unit: 'ตัว (Unit)',
            price: 8800,
            stock: 8,
            minStock: 4,
            maxStock: 16,
            bin: 'WH3-ELEC-A09',
            sapTcode: 'MMBE',
            leadTimeDays: 7,
            imageEmoji: '🔀'
        },
        {
            matNo: 'MAT-100955',
            name: 'Expanded Graphite Packing Seal 1/2" Roll',
            category: 'seals',
            spec: 'Inconel Wire Reinforced, Temp up to 650°C, 5kg/box',
            unit: 'ม้วน (Roll)',
            price: 3200,
            stock: 12,
            minStock: 6,
            maxStock: 24,
            bin: 'WH1-SHELF-B03',
            sapTcode: 'MMBE',
            leadTimeDays: 4,
            imageEmoji: '📦'
        }
    ];

    // SAP T-Code Bridge Directory
    const SAP_TCODES = [
        { code: 'IW21', legacyName: 'Create Notification', modernName: 'แจ้งซ่อมด่วน (E-Notification)', targetTab: 'maintenance', action: 'openNewNoti', desc: 'แจ้งอุปกรณ์ชำรุด/เหตุฉุกเฉินหน้างานใน 3 คลิก' },
        { code: 'IW22', legacyName: 'Change Notification', modernName: 'แก้ไข/อัปเดตใบแจ้งซ่อม', targetTab: 'maintenance', action: 'filterNoti', desc: 'ปรับปรุงรายละเอียดหรือข้อเสนอแนะในการซ่อม' },
        { code: 'IW31', legacyName: 'Create Work Order', modernName: 'เปิดใบสั่งงานซ่อม (Work Order)', targetTab: 'maintenance', action: 'openNewWO', desc: 'มอบหมายช่าง เบิกของ วางแผนชั่วโมงซ่อม' },
        { code: 'IW32', legacyName: 'Change Work Order', modernName: 'กระดาน Kanban ติดตามงานซ่อม', targetTab: 'maintenance', action: 'showKanban', desc: 'เลื่อนสถานะงานซ่อมแบบ Drag & Drop' },
        { code: 'IW38', legacyName: 'List Work Orders', modernName: 'ตารางรายงานสรุปงานซ่อมทั้งหมด', targetTab: 'maintenance', action: 'showList', desc: 'ดูประวัติและสรุปผลงานซ่อมบำรุง' },
        { code: 'MMBE', legacyName: 'Stock Overview', modernName: 'ค้นหาสต็อกอะไหล่แบบ Visual', targetTab: 'inventory', action: 'focusSearch', desc: 'ดูยอดคงเหลือจริง รูปอะไหล่ และพิกัดชั้นวาง' },
        { code: 'ME51N', legacyName: 'Create Purchase Req', modernName: 'สร้างใบขอซื้อพัสดุ (E-PR)', targetTab: 'inventory', action: 'openCart', desc: 'ขอซื้ออะไหล่เข้าระบบด้วยระบบตะกร้าสินค้า' },
        { code: 'MB1A', legacyName: 'Goods Issue', modernName: 'ขอเบิกพัสดุจากคลัง (E-Requisition)', targetTab: 'inventory', action: 'openCart', desc: 'ตัดสต็อกอะไหล่เข้าใบสั่งงาน (Work Order)' },
        { code: 'MIGO', legacyName: 'Goods Movement', modernName: 'ตรวจรับ/โอนย้ายพัสดุ', targetTab: 'inventory', action: 'showStock', desc: 'รับพัสดุเข้าคลังและอัปเดตสต็อกทันที' },
        { code: 'SBWP', legacyName: 'Business Workplace / Workflow', modernName: 'ศูนย์รวมการอนุมัติ (Fast Approval)', targetTab: 'approvals', action: 'showApprovals', desc: 'อนุมัติ PR/WO ทุกฉบับในหน้าเดียวในคลิกเดียว' }
    ];

    // Seed Initial State
    function getInitialData() {
        return {
            userRole: 'engineer', // 'engineer' (ช่าง/วิศวกร), 'warehouse' (พัสดุ), 'manager' (ผู้อนุมัติ)
            userName: 'วศ. เกรียงไกร (แผนกบำรุงรักษาโรงไฟฟ้า)',
            activeTab: 'overview', // 'overview', 'maintenance', 'inventory', 'approvals', 'tcode-guide'
            searchTerm: '',
            filterCategory: 'all',
            cart: [], // Selected materials for requisition
            notifications: [
                {
                    id: 'NOTI-2026-089',
                    equipId: 'HRSG-BFP-01',
                    equipName: 'Boiler Feed Pump A (HRSG Unit 1)',
                    priority: 'emergency', // emergency, high, normal
                    title: 'แรงสั่นสะเทือน BFP-A ขึ้นสูงเกิน 7.5 mm/s (Vibration High Alarm)',
                    desc: 'พบเสียงดังผิดปกติที่ Drive-end Bearing ตรวจวัดการสั่นสะเทือนขึ้นต่อเนื่อง เสี่ยงทริปหม้อต้ม',
                    reporter: 'วิศวกรเดินเครื่อง กะ 1',
                    createdAt: '2026-10-20 08:30',
                    status: 'converted_to_wo',
                    workOrderId: 'WO-400182'
                },
                {
                    id: 'NOTI-2026-092',
                    equipId: 'FGD-ABS-01',
                    equipName: 'Wet FGD Absorber Tower #1 (แม่เมาะ)',
                    priority: 'high',
                    title: 'Spray Header Level 2 แรงดันตก อัตรากำจัด SO2 ลดลง',
                    desc: 'คาดว่า SiC Spray Nozzle อุดตันจากหินปูนเกาะสะสม ต้องเตรียมเปลี่ยนอะไหล่',
                    reporter: 'ช่างควบคุมระบบบำบัด',
                    createdAt: '2026-10-20 10:15',
                    status: 'pending_wo',
                    workOrderId: null
                },
                {
                    id: 'NOTI-2026-095',
                    equipId: 'GT-ROTOR-02',
                    equipName: 'Gas Turbine #2 Rotor & Casing',
                    priority: 'normal',
                    title: 'อุณหภูมิน้ำมันหล่อลื่น Lube Oil Cooler สูงกว่าปกติ 4°C',
                    desc: 'ตรวจสอบแผงระบายความร้อน พบครีบระบายมีฝุ่นเกาะหนาแน่น วางแผนล้างทำความสะอาด',
                    reporter: 'ทีมตรวจสภาพเครื่องจักร',
                    createdAt: '2026-10-19 14:00',
                    status: 'pending_wo',
                    workOrderId: null
                }
            ],
            workOrders: [
                {
                    id: 'WO-400182',
                    title: 'เปลี่ยน Mechanical Seal และตลับลูกปืน BFP-A (ฉุกเฉิน)',
                    equipId: 'HRSG-BFP-01',
                    equipName: 'Boiler Feed Pump A',
                    priority: 'emergency',
                    column: 'in_progress', // 'backlog', 'in_progress', 'waiting_parts', 'completed'
                    assignee: 'ช่างสมชาย & ทีมเครื่องกล 4 นาย',
                    plannedHours: 6,
                    actualHours: 3.5,
                    partsUsed: ['MAT-100293 x 1 ชุด', 'MAT-100412 x 2 แผ่น'],
                    targetTime: 'วันนี้ 18:00',
                    updatedAt: '2026-10-20 11:30'
                },
                {
                    id: 'WO-400185',
                    title: 'ตรวจสอบและตั้ง Balance มอเตอร์ Cooling Water Pump 4',
                    equipId: 'CW-PUMP-04',
                    equipName: 'Main Cooling Water Pump 4',
                    priority: 'normal',
                    column: 'backlog',
                    assignee: 'วิศวกรเครื่องมือวัด กอง 2',
                    plannedHours: 4,
                    actualHours: 0,
                    partsUsed: [],
                    targetTime: 'พรุ่งนี้ 12:00',
                    updatedAt: '2026-10-20 09:00'
                },
                {
                    id: 'WO-400178',
                    title: 'ล้างทำความสะอาดและเปลี่ยน Nozzle หอดูดซับ FGD หน่วย 8',
                    equipId: 'FGD-ABS-01',
                    equipName: 'Wet FGD Absorber Tower #1',
                    priority: 'high',
                    column: 'waiting_parts',
                    assignee: 'ทีมบำรุงรักษาเคมีภัณฑ์',
                    plannedHours: 8,
                    actualHours: 2,
                    partsUsed: ['MAT-100811 x 6 หัว (รอเบิก)'],
                    targetTime: '2026-10-22',
                    updatedAt: '2026-10-20 10:45'
                },
                {
                    id: 'WO-400160',
                    title: 'เปลี่ยนถ่ายน้ำมันหล่อลื่น Turbine Generator 1 ครบรอบ 10,000 ชม.',
                    equipId: 'ST-GEN-01',
                    equipName: 'Steam Turbine Generator 1',
                    priority: 'normal',
                    column: 'completed',
                    assignee: 'ทีมหล่อลื่นส่วนกลาง',
                    plannedHours: 5,
                    actualHours: 4.8,
                    partsUsed: ['MAT-100790 x 2 ถัง'],
                    targetTime: 'เสร็จสิ้นแล้ว',
                    updatedAt: '2026-10-18 16:00'
                }
            ],
            materials: MASTER_MATERIALS,
            approvals: [
                {
                    id: 'APR-PR-901',
                    type: 'PR',
                    docNo: 'PR-100489',
                    title: 'ขอซื้อด่วน: ตลับลูกปืน SKF 22220-E1 จำนวน 4 ตลับ (สต็อกต่ำกว่าเกณฑ์ Min-Stock)',
                    requester: 'จนท. พัสดุ คลังแม่เมาะ',
                    department: 'แผนกพัสดุและคลังอะไหล่',
                    amount: 56800,
                    currency: 'THB',
                    urgency: 'high',
                    relatedRef: 'MAT-100588 (คงเหลือ 1 ตลับ)',
                    status: 'pending', // 'pending', 'approved', 'rejected'
                    submittedAt: '2026-10-20 09:15',
                    notes: 'จำเป็นต้องสำรองด่วนเพื่อรองรับงาน Overhaul หม้อต้มเดือนหน้า'
                },
                {
                    id: 'APR-WO-802',
                    type: 'WO',
                    docNo: 'WO-400182',
                    title: 'ขออนุมัติเปิดงานซ่อมฉุกเฉินนอกเวลาทำการ (Overtime Work Order BFP-A)',
                    requester: 'หน. ช่างสมชาย',
                    department: 'แผนกบำรุงรักษาเครื่องกล',
                    amount: 45000,
                    currency: 'THB',
                    urgency: 'emergency',
                    relatedRef: 'HRSG-BFP-01 ปั๊มน้ำป้อน',
                    status: 'pending',
                    submittedAt: '2026-10-20 10:30',
                    notes: 'เพื่อป้องกันการทริปและสูญเสียกำลังผลิตไฟฟ้า 450 MW'
                },
                {
                    id: 'APR-ISS-703',
                    type: 'RESERVATION',
                    docNo: 'RES-88310',
                    title: 'ขอเบิก Pressure Transmitter Rosemount 2 ตัว ติดตั้งสำรองจุดตรวจวัดแรงดันไอน้ำ',
                    requester: 'วศ. เกรียงไกร',
                    department: 'แผนกเครื่องมือวัดและควบคุม',
                    amount: 84000,
                    currency: 'THB',
                    urgency: 'normal',
                    relatedRef: 'MAT-100645 เข้าใบงาน WO-400185',
                    status: 'pending',
                    submittedAt: '2026-10-20 11:00',
                    notes: 'เบิกจ่ายเข้า Cost Center 4420-HRSG'
                }
            ],
            auditLogs: [
                { timestamp: '2026-10-20 08:35', action: 'CREATE_NOTI', doc: 'NOTI-2026-089', user: 'วศ. เกรียงไกร', detail: 'สร้างใบแจ้งซ่อมด่วน BFP-A แรงสั่นสะเทือนสูง' },
                { timestamp: '2026-10-20 08:45', action: 'CONVERT_WO', doc: 'WO-400182', user: 'หน. แผนกเครื่องกล', detail: 'อนุมัติเปิดใบสั่งงานฉุกเฉิน มอบหมายทีมช่างสมชาย' },
                { timestamp: '2026-10-18 16:30', action: 'APPROVE', doc: 'WO-400160', user: 'ผอ. ฝ่ายบำรุงรักษา', detail: 'ลงนามปิดงานซ่อมบำรุง (Technical Complete - TECO)' }
            ]
        };
    }

    // State Holder
    let state = null;

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                state = JSON.parse(raw);
                return;
            }
        } catch (e) {
            console.error('Failed to load SmartOps state from storage', e);
        }
        state = getInitialData();
        saveState();
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error('Failed to save SmartOps state', e);
        }
    }

    function resetData() {
        if (confirm('ต้องการรีเซ็ตข้อมูลตัวอย่างของระบบ Smart Operations กลับสู่ค่าเริ่มต้นหรือไม่?')) {
            localStorage.removeItem(STORAGE_KEY);
            state = getInitialData();
            saveState();
            renderApp();
            showToast('🔄 รีเซ็ตข้อมูลจำลองของระบบเรียบร้อยแล้ว');
        }
    }

    // =========================================================================
    // TOAST NOTIFICATIONS & FEEDBACK
    // =========================================================================
    function showToast(message, type = 'success') {
        const existing = document.getElementById('smartops-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'smartops-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
            color: #ffffff;
            font-size: 0.9rem;
            font-weight: 700;
            padding: 12px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.4);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: toastSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        `;
        toast.innerHTML = `<span>${message}</span>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast) {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.3s';
                setTimeout(() => toast.remove(), 300);
            }
        }, 3200);
    }

    // =========================================================================
    // RENDER MAIN SHELL & TABS
    // =========================================================================
    function renderApp() {
        const root = document.getElementById('smartops-app-root');
        if (!root) return;

        const pendingApprovalsCount = state.approvals.filter(a => a.status === 'pending').length;
        const lowStockCount = state.materials.filter(m => m.stock < m.minStock).length;
        const emergencyCount = state.workOrders.filter(w => w.priority === 'emergency' && w.column !== 'completed').length;

        root.innerHTML = `
            <div class="smartops-container">
                <!-- Top Enterprise Navigation & Command Bar -->
                <header class="smartops-header">
                    <div class="smartops-header-top">
                        <div class="smartops-brand-info">
                            <div class="smartops-brand-badge">
                                <span class="badge-dot"></span>
                                ENTERPRISE PORTAL
                            </div>
                            <h2>EGAT Smart Operations <span>(ทดแทน SAP)</span></h2>
                            <p class="smartops-subtitle">ระบบบริหารงานโรงไฟฟ้าและคลังพัสดุยุคใหม่ ใช้ง่าย รวดเร็ว รองรับงานซ่อมบำรุง PM, คลังอะไหล่ MM และศูนย์อนุมัติในหน้าเดียว</p>
                        </div>

                        <!-- Role Simulation Switcher & Reset -->
                        <div class="smartops-role-box">
                            <div class="role-selector-pill">
                                <span class="role-label">สวมบทบาท:</span>
                                <select id="smartops-role-select" class="smartops-select">
                                    <option value="engineer" ${state.userRole === 'engineer' ? 'selected' : ''}>👨‍🔧 วิศวกร/ช่างหน้างาน (PM)</option>
                                    <option value="warehouse" ${state.userRole === 'warehouse' ? 'selected' : ''}>📦 เจ้าหน้าที่พัสดุ (MM)</option>
                                    <option value="manager" ${state.userRole === 'manager' ? 'selected' : ''}>👔 หน.แผนก/ผู้อนุมัติ (Workflow)</option>
                                </select>
                            </div>
                            <button id="smartops-reset-btn" class="smartops-btn-ghost" title="รีเซ็ตข้อมูลตัวอย่าง">
                                🔄 รีเซ็ตข้อมูล
                            </button>
                        </div>
                    </div>

                    <!-- Instant T-Code Command Bar (The SAP Bridge) -->
                    <div class="smartops-command-bar">
                        <div class="command-input-wrap">
                            <span class="command-icon">⚡</span>
                            <input 
                                type="text" 
                                id="smartops-command-input" 
                                class="command-input" 
                                placeholder="พิมพ์ค้นหางาน, อะไหล่, เครื่องจักร หรือรหัส SAP เดิม (เช่น IW21, ME51N, MMBE, IW32, SBWP)..."
                                value="${escapeHtml(state.searchTerm)}"
                            />
                            <button id="smartops-command-clear" class="command-clear ${state.searchTerm ? '' : 'hidden'}">✕</button>
                        </div>
                        <div class="command-suggestions">
                            <span class="sugg-tag" data-tcode="IW21">IW21 แจ้งซ่อมด่วน</span>
                            <span class="sugg-tag" data-tcode="IW32">IW32 Kanban งานซ่อม</span>
                            <span class="sugg-tag" data-tcode="MMBE">MMBE เช็คสต็อกอะไหล่</span>
                            <span class="sugg-tag" data-tcode="ME51N">ME51N ขอซื้อ E-PR</span>
                            <span class="sugg-tag" data-tcode="SBWP">SBWP รออนุมัติ (${pendingApprovalsCount})</span>
                        </div>
                    </div>

                    <!-- Navigation Tabs -->
                    <nav class="smartops-tabs-nav">
                        <button class="smartops-tab-btn ${state.activeTab === 'overview' ? 'active' : ''}" data-tab="overview">
                            📊 ภาพรวมระบบ (Dashboard)
                        </button>
                        <button class="smartops-tab-btn ${state.activeTab === 'maintenance' ? 'active' : ''}" data-tab="maintenance">
                            🔧 งานซ่อมบำรุง PM
                            ${emergencyCount > 0 ? `<span class="badge-count badge-danger">${emergencyCount} ด่วน</span>` : ''}
                        </button>
                        <button class="smartops-tab-btn ${state.activeTab === 'inventory' ? 'active' : ''}" data-tab="inventory">
                            📦 คลังพัสดุ & ขอเบิก MM
                            ${lowStockCount > 0 ? `<span class="badge-count badge-warning">${lowStockCount} เติมสต็อก</span>` : ''}
                        </button>
                        <button class="smartops-tab-btn ${state.activeTab === 'approvals' ? 'active' : ''}" data-tab="approvals">
                            ⚡ ศูนย์รวมการอนุมัติ (Workflow)
                            ${pendingApprovalsCount > 0 ? `<span class="badge-count badge-primary">${pendingApprovalsCount}</span>` : ''}
                        </button>
                        <button class="smartops-tab-btn ${state.activeTab === 'tcode-guide' ? 'active' : ''}" data-tab="tcode-guide">
                            📖 คู่มือเทียบ T-Code (SAP Bridge)
                        </button>
                    </nav>
                </header>

                <!-- Main View Body by Active Tab -->
                <main class="smartops-body">
                    ${renderTabContent()}
                </main>

                <!-- Modals Container -->
                <div id="smartops-modal-container"></div>

                <!-- Floating Cart Drawer for Material Requisitions -->
                ${renderCartDrawer()}
            </div>
        `;

        bindEvents();
    }

    // =========================================================================
    // TAB ROUTING & CONTENT GENERATORS
    // =========================================================================
    function renderTabContent() {
        switch (state.activeTab) {
            case 'overview':
                return renderOverviewTab();
            case 'maintenance':
                return renderMaintenanceTab();
            case 'inventory':
                return renderInventoryTab();
            case 'approvals':
                return renderApprovalsTab();
            case 'tcode-guide':
                return renderTCodeGuideTab();
            default:
                return renderOverviewTab();
        }
    }

    // -------------------------------------------------------------------------
    // TAB 1: OVERVIEW & DASHBOARD
    // -------------------------------------------------------------------------
    function renderOverviewTab() {
        const pendingApprovals = state.approvals.filter(a => a.status === 'pending');
        const lowStockParts = state.materials.filter(m => m.stock < m.minStock);
        const activeWorkOrders = state.workOrders.filter(w => w.column !== 'completed');
        const emergencyWorkOrders = state.workOrders.filter(w => w.priority === 'emergency' && w.column !== 'completed');

        return `
            <div class="smartops-dashboard">
                <!-- Emergency Breakdown Alert Banner (If Any) -->
                ${emergencyWorkOrders.length > 0 ? `
                    <div class="emergency-banner">
                        <div class="emergency-icon-pulse">🚨</div>
                        <div class="emergency-content">
                            <h4>แจ้งเตือนวิกฤตหน้างาน (Critical Breakdown In Progress)</h4>
                            <p>${escapeHtml(emergencyWorkOrders[0].title)} [เครื่องจักร: <strong>${escapeHtml(emergencyWorkOrders[0].equipName)}</strong>] - ช่างเข้าปฏิบัติงานแล้ว กำหนดเสร็จ: ${escapeHtml(emergencyWorkOrders[0].targetTime)}</p>
                        </div>
                        <button class="smartops-btn btn-danger-solid" onclick="window.SmartOps.jumpToWO('${emergencyWorkOrders[0].id}')">
                            ดูใบงานซ่อมด่วน (IW32) →
                        </button>
                    </div>
                ` : ''}

                <!-- Top 4 Modern KPI Cards -->
                <div class="kpi-grid">
                    <div class="kpi-card bg-indigo-subtle">
                        <div class="kpi-header">
                            <span class="kpi-title">ใบแจ้งซ่อมที่เปิดอยู่ (Active Noti)</span>
                            <span class="kpi-tag">SAP: IW28</span>
                        </div>
                        <div class="kpi-value-row">
                            <span class="kpi-value text-indigo">${state.notifications.length}</span>
                            <span class="kpi-sub">งานในระบบ</span>
                        </div>
                        <div class="kpi-footer">
                            <span>ฉุกเฉิน 1 รายการ • ปกติ ${state.notifications.length - 1} รายการ</span>
                        </div>
                    </div>

                    <div class="kpi-card bg-rose-subtle">
                        <div class="kpi-header">
                            <span class="kpi-title">งานซ่อมกำลังดำเนินงาน (Active WOs)</span>
                            <span class="kpi-tag">SAP: IW38</span>
                        </div>
                        <div class="kpi-value-row">
                            <span class="kpi-value text-rose">${activeWorkOrders.length}</span>
                            <span class="kpi-sub">ใบสั่งงาน</span>
                        </div>
                        <div class="kpi-footer">
                            <span class="text-rose font-bold">⚠️ งานฉุกเฉินเร่งด่วน ${emergencyWorkOrders.length} งาน</span>
                        </div>
                    </div>

                    <div class="kpi-card bg-amber-subtle">
                        <div class="kpi-header">
                            <span class="kpi-title">อะไหล่ต่ำกว่าเกณฑ์สั่งซื้อ (Low Stock)</span>
                            <span class="kpi-tag">SAP: MD04/MMBE</span>
                        </div>
                        <div class="kpi-value-row">
                            <span class="kpi-value text-amber">${lowStockParts.length}</span>
                            <span class="kpi-sub">รายการพัสดุ</span>
                        </div>
                        <div class="kpi-footer">
                            <span>แนะนำให้ออกใบขอซื้อ (E-PR) ทันที</span>
                        </div>
                    </div>

                    <div class="kpi-card bg-emerald-subtle">
                        <div class="kpi-header">
                            <span class="kpi-title">รอการอนุมัติของฉัน (Pending Approval)</span>
                            <span class="kpi-tag">SAP: SBWP</span>
                        </div>
                        <div class="kpi-value-row">
                            <span class="kpi-value text-emerald">${pendingApprovals.length}</span>
                            <span class="kpi-sub">ฉบับ</span>
                        </div>
                        <div class="kpi-footer">
                            <span>มูลค่ารวม: ฿${formatNumber(pendingApprovals.reduce((sum, a) => sum + a.amount, 0))}</span>
                        </div>
                    </div>
                </div>

                <!-- Quick Action Bar -->
                <div class="quick-action-strip">
                    <span class="quick-title">เมนูลัดประจำวัน (One-Click Actions):</span>
                    <button class="smartops-btn btn-primary" onclick="window.SmartOps.openNewNotiModal()">
                        ➕ แจ้งซ่อมด่วน (IW21)
                    </button>
                    <button class="smartops-btn btn-secondary" onclick="window.SmartOps.switchTab('inventory')">
                        🔍 ค้นหาและเบิกอะไหล่ (MMBE)
                    </button>
                    <button class="smartops-btn btn-secondary" onclick="window.SmartOps.switchTab('maintenance')">
                        📋 ดูกระดาน Kanban งานซ่อม (IW32)
                    </button>
                    <button class="smartops-btn btn-secondary" onclick="window.SmartOps.switchTab('approvals')">
                        ⚡ ลงนามอนุมัติเอกสาร (${pendingApprovals.length})
                    </button>
                </div>

                <!-- 2 Columns: Live Plant Feed & Critical Machine Health -->
                <div class="dashboard-two-col">
                    <!-- Left: Real-Time Plant Operations Feed -->
                    <div class="dash-card">
                        <div class="dash-card-header">
                            <h3>📡 ฟีดบันทึกการปฏิบัติงานล่าสุด (Plant Audit Feed)</h3>
                            <span class="badge-tag">Real-time</span>
                        </div>
                        <div class="feed-list">
                            ${state.auditLogs.map(log => `
                                <div class="feed-item">
                                    <div class="feed-time">${log.timestamp.slice(11, 16)} น.</div>
                                    <div class="feed-body">
                                        <div class="feed-head">
                                            <span class="feed-badge">${escapeHtml(log.action)}</span>
                                            <strong>${escapeHtml(log.doc)}</strong>
                                            <span class="feed-user">โดย ${escapeHtml(log.user)}</span>
                                        </div>
                                        <p class="feed-detail">${escapeHtml(log.detail)}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Right: Critical Equipment Watchlist -->
                    <div class="dash-card">
                        <div class="dash-card-header">
                            <h3>⚙️ สถานะเครื่องจักรวิกฤต (Critical Equipment Health)</h3>
                            <span class="badge-tag">โรงไฟฟ้า & Wet FGD</span>
                        </div>
                        <div class="equip-health-list">
                            ${MASTER_EQUIPMENTS.slice(0, 5).map(eq => {
                                const activeWo = state.workOrders.find(w => w.equipId === eq.id && w.column !== 'completed');
                                const isEmergency = activeWo && activeWo.priority === 'emergency';
                                return `
                                    <div class="equip-health-item ${isEmergency ? 'border-danger' : ''}">
                                        <div class="equip-info">
                                            <div class="equip-code">${escapeHtml(eq.id)}</div>
                                            <div class="equip-name">${escapeHtml(eq.name)}</div>
                                            <span class="equip-area">📍 ${escapeHtml(eq.area)}</span>
                                        </div>
                                        <div class="equip-status-badge ${isEmergency ? 'status-down' : activeWo ? 'status-maint' : 'status-healthy'}">
                                            ${isEmergency ? '⚠️ ฉุกเฉิน' : activeWo ? '⚙️ ซ่อมบำรุง' : '✅ ปกติ 100%'}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // -------------------------------------------------------------------------
    // TAB 2: MAINTENANCE HUB (SAP PM: NOTIFICATIONS & KANBAN WORK ORDERS)
    // -------------------------------------------------------------------------
    function renderMaintenanceTab() {
        const kanbanCols = [
            { key: 'backlog', title: '📥 รอดำเนินการ (Backlog)', color: '#94a3b8' },
            { key: 'in_progress', title: '⚙️ กำลังปฏิบัติงาน (In Progress)', color: '#38bdf8' },
            { key: 'waiting_parts', title: '⏳ รออะไหล่/หยุดเครื่อง (Waiting)', color: '#f59e0b' },
            { key: 'completed', title: '✅ เสร็จสมบูรณ์ (Completed / TECO)', color: '#10b981' }
        ];

        return `
            <div class="smartops-maintenance">
                <div class="section-toolbar">
                    <div class="toolbar-left">
                        <h3>🔧 กระดานสั่งงานและติดตามงานซ่อมบำรุง (Maintenance Kanban)</h3>
                        <p class="text-muted">ทดแทนคำสั่ง SAP: IW31, IW32, IW38 • ปรับปรุงสถานะได้ด้วยคลิกเดียว</p>
                    </div>
                    <div class="toolbar-right">
                        <button class="smartops-btn btn-primary" onclick="window.SmartOps.openNewNotiModal()">
                            ➕ สร้างใบแจ้งซ่อมใหม่ (IW21)
                        </button>
                    </div>
                </div>

                <!-- 4 Kanban Columns -->
                <div class="kanban-board">
                    ${kanbanCols.map(col => {
                        const items = state.workOrders.filter(w => w.column === col.key);
                        return `
                            <div class="kanban-col" data-col="${col.key}">
                                <div class="kanban-col-header" style="border-top-color: ${col.color}">
                                    <div class="col-title">
                                        <span>${col.title}</span>
                                        <span class="col-count">${items.length}</span>
                                    </div>
                                </div>
                                <div class="kanban-items-list">
                                    ${items.length === 0 ? `
                                        <div class="kanban-empty">ไม่มีงานในสถานะนี้</div>
                                    ` : items.map(wo => renderWorkOrderCard(wo)).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- Bottom Notifications Drawer / Table -->
                <div class="notifications-section">
                    <div class="dash-card-header">
                        <h3>📋 รายการแจ้งเหตุขัดข้องหน้างาน (Maintenance Notifications - IW28)</h3>
                        <span class="badge-tag">ทั้งหมด ${state.notifications.length} รายการ</span>
                    </div>
                    <div class="noti-table-wrap">
                        <table class="smartops-table">
                            <thead>
                                <tr>
                                    <th>รหัสแจ้งซ่อม</th>
                                    <th>ระดับความเร่งด่วน</th>
                                    <th>เครื่องจักร / จุดเกิดเหตุ</th>
                                    <th>อาการและข้อขัดข้อง</th>
                                    <th>ผู้รายงาน</th>
                                    <th>สถานะ</th>
                                    <th>การจัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${state.notifications.map(n => `
                                    <tr>
                                        <td><strong>${escapeHtml(n.id)}</strong></td>
                                        <td>
                                            <span class="badge-priority ${n.priority}">
                                                ${n.priority === 'emergency' ? '🚨 ฉุกเฉิน' : n.priority === 'high' ? '⚡ สูง' : 'ปกติ'}
                                            </span>
                                        </td>
                                        <td>
                                            <div class="font-bold">${escapeHtml(n.equipName)}</div>
                                            <span class="text-xs text-muted">${escapeHtml(n.equipId)}</span>
                                        </td>
                                        <td>
                                            <div class="font-bold">${escapeHtml(n.title)}</div>
                                            <div class="text-xs text-muted">${escapeHtml(n.desc)}</div>
                                        </td>
                                        <td>${escapeHtml(n.reporter)}<br/><span class="text-xs text-muted">${escapeHtml(n.createdAt)}</span></td>
                                        <td>
                                            ${n.status === 'converted_to_wo' ? `
                                                <span class="badge-tag text-emerald">เปิดใบงานแล้ว (${escapeHtml(n.workOrderId)})</span>
                                            ` : `
                                                <span class="badge-tag text-amber">รอเปิดใบสั่งงาน</span>
                                            `}
                                        </td>
                                        <td>
                                            ${n.status !== 'converted_to_wo' ? `
                                                <button class="btn-table-action" onclick="window.SmartOps.convertToWO('${n.id}')">
                                                    เปิดใบสั่งงาน (IW31) →
                                                </button>
                                            ` : `
                                                <span class="text-muted text-xs">ดำเนินการแล้ว</span>
                                            `}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    function renderWorkOrderCard(wo) {
        return `
            <div class="wo-card ${wo.priority === 'emergency' ? 'wo-emergency' : ''}" id="wo-card-${wo.id}">
                <div class="wo-card-top">
                    <span class="wo-id">${escapeHtml(wo.id)}</span>
                    <span class="badge-priority ${wo.priority}">
                        ${wo.priority === 'emergency' ? '🚨 ฉุกเฉิน' : wo.priority === 'high' ? 'สูง' : 'ปกติ'}
                    </span>
                </div>
                <h4 class="wo-title">${escapeHtml(wo.title)}</h4>
                <div class="wo-equip">📍 ${escapeHtml(wo.equipName)}</div>
                
                <div class="wo-meta-row">
                    <span>👨‍🔧 ${escapeHtml(wo.assignee)}</span>
                    <span>⏱️ เป้าหมาย: ${escapeHtml(wo.targetTime)}</span>
                </div>

                ${wo.partsUsed.length > 0 ? `
                    <div class="wo-parts-chip">
                        📦 อะไหล่: ${wo.partsUsed.join(', ')}
                    </div>
                ` : ''}

                <!-- One-Click Kanban Status Advance -->
                <div class="wo-actions-row">
                    ${wo.column === 'backlog' ? `
                        <button class="btn-kanban-next" onclick="window.SmartOps.moveWO('${wo.id}', 'in_progress')">
                            เริ่มทำงาน (Start) ⚙️
                        </button>
                    ` : wo.column === 'in_progress' ? `
                        <button class="btn-kanban-sub" onclick="window.SmartOps.moveWO('${wo.id}', 'waiting_parts')">
                            รออะไหล่ ⏳
                        </button>
                        <button class="btn-kanban-next btn-finish" onclick="window.SmartOps.moveWO('${wo.id}', 'completed')">
                            ปิดงาน (TECO) ✅
                        </button>
                    ` : wo.column === 'waiting_parts' ? `
                        <button class="btn-kanban-next" onclick="window.SmartOps.moveWO('${wo.id}', 'in_progress')">
                            ได้ของแล้ว ทำต่อ ⚙️
                        </button>
                    ` : `
                        <span class="text-xs text-emerald font-bold">✓ เสร็จสมบูรณ์แล้ว</span>
                    `}
                </div>
            </div>
        `;
    }

    // -------------------------------------------------------------------------
    // TAB 3: INVENTORY & MATERIALS MANAGEMENT (SAP MM: STOCK & E-REQUISITION)
    // -------------------------------------------------------------------------
    function renderInventoryTab() {
        const categories = [
            { id: 'all', name: 'ทั้งหมด (All)' },
            { id: 'pumps', name: 'ปั๊มและวาล์ว (Pumps/Valves)' },
            { id: 'electrical', name: 'ไฟฟ้า & เครื่องมือวัด (Electrical/Inst)' },
            { id: 'bearings', name: 'ตลับลูกปืน (Bearings)' },
            { id: 'seals', name: 'ซีลและปะเก็น (Seals/Gaskets)' },
            { id: 'lubricants', name: 'สารหล่อลื่น (Lubricants)' }
        ];

        let filtered = state.materials;
        if (state.filterCategory !== 'all') {
            filtered = filtered.filter(m => m.category === state.filterCategory);
        }
        if (state.searchTerm) {
            const q = state.searchTerm.toLowerCase();
            filtered = filtered.filter(m => 
                m.name.toLowerCase().includes(q) || 
                m.matNo.toLowerCase().includes(q) || 
                m.spec.toLowerCase().includes(q) ||
                m.bin.toLowerCase().includes(q)
            );
        }

        const totalCartItems = state.cart.reduce((sum, item) => sum + item.qty, 0);

        return `
            <div class="smartops-inventory">
                <div class="section-toolbar">
                    <div class="toolbar-left">
                        <h3>📦 คลังพัสดุและขอเบิกอะไหล่ (Visual Stock Catalog & Requisition)</h3>
                        <p class="text-muted">ทดแทนคำสั่ง SAP: MMBE (เช็คสต็อก), ME51N (ขอซื้อ), MB1A (เบิกอะไหล่)</p>
                    </div>
                    <div class="toolbar-right">
                        <button class="smartops-btn btn-cart-trigger" onclick="window.SmartOps.toggleCartDrawer()">
                            🛒 ตะกร้าขอเบิก/ขอซื้อ (${totalCartItems})
                        </button>
                    </div>
                </div>

                <!-- Category Filters -->
                <div class="category-pills-row">
                    ${categories.map(c => `
                        <button 
                            class="cat-pill ${state.filterCategory === c.id ? 'active' : ''}" 
                            onclick="window.SmartOps.setFilterCategory('${c.id}')"
                        >
                            ${c.name}
                        </button>
                    `).join('')}
                </div>

                <!-- Materials Grid Cards -->
                <div class="materials-grid">
                    ${filtered.length === 0 ? `
                        <div class="no-results-box">
                            <span style="font-size: 2.5rem;">🔍</span>
                            <p>ไม่พบรายการพัสดุที่ตรงกับคำค้นหา "${escapeHtml(state.searchTerm)}"</p>
                        </div>
                    ` : filtered.map(mat => {
                        const isLow = mat.stock < mat.minStock;
                        const stockPct = Math.min(100, (mat.stock / mat.maxStock) * 100);
                        return `
                            <div class="mat-card ${isLow ? 'mat-card-low' : ''}">
                                <div class="mat-card-header">
                                    <div class="mat-avatar">${mat.imageEmoji}</div>
                                    <div class="mat-id-block">
                                        <span class="mat-no">${escapeHtml(mat.matNo)}</span>
                                        <span class="mat-bin">📍 พิกัดชั้นวาง: <strong>${escapeHtml(mat.bin)}</strong></span>
                                    </div>
                                    ${isLow ? `<span class="badge-low-stock">สต็อกต่ำกว่าเกณฑ์!</span>` : ''}
                                </div>

                                <h4 class="mat-name">${escapeHtml(mat.name)}</h4>
                                <p class="mat-spec">${escapeHtml(mat.spec)}</p>

                                <!-- Visual Stock Level Bar -->
                                <div class="stock-meter-block">
                                    <div class="stock-labels">
                                        <span>ยอดคงคลัง (Available):</span>
                                        <strong class="${isLow ? 'text-rose' : 'text-emerald'}">${mat.stock} ${escapeHtml(mat.unit)}</strong>
                                    </div>
                                    <div class="stock-bar-bg">
                                        <div class="stock-bar-fill ${isLow ? 'fill-rose' : 'fill-emerald'}" style="width: ${stockPct}%"></div>
                                    </div>
                                    <div class="stock-minmax">
                                        <span>Min: ${mat.minStock}</span>
                                        <span>Max: ${mat.maxStock}</span>
                                    </div>
                                </div>

                                <div class="mat-price-row">
                                    <span class="mat-price">฿${formatNumber(mat.price)} / ${escapeHtml(mat.unit)}</span>
                                    <span class="text-xs text-muted">รอรับของ: ${mat.leadTimeDays} วัน</span>
                                </div>

                                <div class="mat-actions">
                                    <button class="smartops-btn btn-primary-outline w-100" onclick="window.SmartOps.addToCart('${mat.matNo}')">
                                        + ใส่ตะกร้าขอเบิก/ขอซื้อ 🛒
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // -------------------------------------------------------------------------
    // TAB 4: FAST APPROVAL HUB (SAP WORKFLOW / SBWP RELEASE)
    // -------------------------------------------------------------------------
    function renderApprovalsTab() {
        const pending = state.approvals.filter(a => a.status === 'pending');
        const history = state.approvals.filter(a => a.status !== 'pending');

        return `
            <div class="smartops-approvals">
                <div class="section-toolbar">
                    <div class="toolbar-left">
                        <h3>⚡ ศูนย์รวมการอนุมัติเอกสาร (Fast Approval Hub)</h3>
                        <p class="text-muted">ทดแทนคำสั่ง SAP: SBWP (Business Workplace) • รวมเอกสาร PR, PO, Work Order อนุมัติได้ใน 1 วินาที</p>
                    </div>
                </div>

                <!-- Pending Approvals Section -->
                <div class="approval-cards-section">
                    <h4 class="sub-section-title">เอกสารรอการอนุมัติของท่าน (${pending.length} ฉบับ)</h4>

                    ${pending.length === 0 ? `
                        <div class="approval-empty-box">
                            <span style="font-size: 3rem;">🎉</span>
                            <h4>ไม่มีเอกสารค้างอนุมัติในขณะนี้</h4>
                            <p class="text-muted">ระบบเคลียร์งานทั้งหมดเรียบร้อยแล้ว การทำงานของโรงไฟฟ้าเป็นไปอย่างราบรื่น</p>
                        </div>
                    ` : pending.map(appr => `
                        <div class="approval-card" id="appr-card-${appr.id}">
                            <div class="approval-card-main">
                                <div class="approval-type-tag ${appr.type.toLowerCase()}">
                                    ${appr.type === 'PR' ? 'ใบขอซื้อพัสดุ (E-PR)' : appr.type === 'WO' ? 'ใบสั่งงานซ่อม (WO)' : 'ใบเบิกอะไหล่ (ISSUE)'}
                                </div>
                                <div class="approval-doc-info">
                                    <div class="appr-doc-no">เลขที่เอกสาร: <strong>${escapeHtml(appr.docNo)}</strong></div>
                                    <h4 class="appr-title">${escapeHtml(appr.title)}</h4>
                                    <div class="appr-meta">
                                        <span>👤 ผู้ขอ: <strong>${escapeHtml(appr.requester)}</strong> (${escapeHtml(appr.department)})</span>
                                        <span>📅 ส่งเมื่อ: ${escapeHtml(appr.submittedAt)}</span>
                                        <span>⚙️ อ้างอิง: ${escapeHtml(appr.relatedRef)}</span>
                                    </div>
                                    <div class="appr-notes">📝 เหตุผลความจำเป็น: "${escapeHtml(appr.notes)}"</div>
                                </div>
                                <div class="approval-amount-block">
                                    <span class="amount-label">มูลค่ารวม</span>
                                    <span class="amount-val">฿${formatNumber(appr.amount)}</span>
                                    <span class="amount-currency">${appr.currency}</span>
                                </div>
                            </div>
                            
                            <div class="approval-card-actions">
                                <button class="btn-reject" onclick="window.SmartOps.rejectApproval('${appr.id}')">
                                    ✕ ส่งกลับแก้ไข / ปฏิเสธ
                                </button>
                                <button class="btn-approve" onclick="window.SmartOps.approveApproval('${appr.id}')">
                                    ✓ อนุมัติเอกสาร (Approve)
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Approved History Section -->
                <div class="approval-history-section">
                    <h4 class="sub-section-title">ประวัติการลงนามอนุมัติย้อนหลัง (Audit Trail Log)</h4>
                    <div class="history-table-wrap">
                        <table class="smartops-table">
                            <thead>
                                <tr>
                                    <th>เลขที่เอกสาร</th>
                                    <th>ประเภท</th>
                                    <th>หัวข้อรายการ</th>
                                    <th>มูลค่า (บาท)</th>
                                    <th>สถานะ</th>
                                    <th>ผลการพิจารณา</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${history.length === 0 ? `
                                    <tr><td colspan="6" class="text-center text-muted">ยังไม่มีประวัติการพิจารณาในรอบนี้</td></tr>
                                ` : history.map(h => `
                                    <tr>
                                        <td><strong>${escapeHtml(h.docNo)}</strong></td>
                                        <td>${escapeHtml(h.type)}</td>
                                        <td>${escapeHtml(h.title)}</td>
                                        <td>฿${formatNumber(h.amount)}</td>
                                        <td>
                                            <span class="badge-status ${h.status === 'approved' ? 'status-approved' : 'status-rejected'}">
                                                ${h.status === 'approved' ? '✓ อนุมัติแล้ว' : '✕ ไม่อนุมัติ'}
                                            </span>
                                        </td>
                                        <td>
                                            <span class="text-xs text-muted">ลงนามดิจิทัลโดย ${escapeHtml(state.userName)}</span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    // -------------------------------------------------------------------------
    // TAB 5: SAP T-CODE BRIDGE CHEAT SHEET
    // -------------------------------------------------------------------------
    function renderTCodeGuideTab() {
        return `
            <div class="smartops-tcode-guide">
                <div class="section-toolbar">
                    <div class="toolbar-left">
                        <h3>📖 ตารางเทียบเคียงรหัสคำสั่ง SAP (T-Code Bridge Cheat Sheet)</h3>
                        <p class="text-muted">สำหรับพนักงานที่คุ้นเคยกับคำสั่ง SAP เดิม ท่านสามารถพิมพ์ T-Code ในช่องค้นหาด้านบนได้ทันที!</p>
                    </div>
                </div>

                <div class="tcode-table-card">
                    <table class="smartops-table tcode-table">
                        <thead>
                            <tr>
                                <th>รหัส SAP (T-Code)</th>
                                <th>ชื่อเดิมใน SAP GUI</th>
                                <th>ฟังก์ชันใหม่ใน Smart Operations</th>
                                <th>คำอธิบาย & สิ่งที่ปรับปรุง</th>
                                <th>ทดลองเปิดใช้งาน</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${SAP_TCODES.map(tc => `
                                <tr>
                                    <td>
                                        <span class="tcode-badge">${escapeHtml(tc.code)}</span>
                                    </td>
                                    <td class="text-muted">${escapeHtml(tc.legacyName)}</td>
                                    <td>
                                        <strong class="text-indigo">${escapeHtml(tc.modernName)}</strong>
                                    </td>
                                    <td>${escapeHtml(tc.desc)}</td>
                                    <td>
                                        <button class="smartops-btn btn-sm btn-primary-outline" onclick="window.SmartOps.executeTCode('${tc.code}')">
                                            เปิดใช้งาน ⚡
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Explanation Box: Architectural Insights & Real-World Constraints -->
                <div class="enterprise-insights-card">
                    <h4>💡 ข้อจำกัดและข้อควรทราบในการนำระบบนี้ไปทดแทน SAP ในองค์กรจริง:</h4>
                    <ul>
                        <li><strong>1. ระบบบัญชีแกนหลัก (Financial Core FI/CO):</strong> SAP เป็นศูนย์กลางผูกมัดงบดุลและภาษีสรรพากร ทางปฏิบัติที่ดีที่สุดคือสร้างเว็บหน้ากากใหม่นี้เป็น <em>Modern Web Front-End (ลักษณะคล้าย SAP Fiori)</em> โดยเชื่อมต่อฐานข้อมูลหลังบ้านผ่าน <strong>REST API / SAP OData Gateway</strong> ทำให้หน้างานใช้งานง่ายโดยไม่ต้องรื้อระบบบัญชีเดิม</li>
                        <li><strong>2. ความปลอดภัยและการแบ่งแยกหน้าที่ (SoD):</strong> ระบบได้จำลองสิทธิ์ของผู้ใช้ 3 บทบาท (ช่างหน้างาน, พัสดุ, ผู้อนุมัติ) ซึ่งในการใช้งานจริงจะเชื่อมต่อกับ Single Sign-On (Active Directory / Azure AD) ขององค์กร</li>
                        <li><strong>3. รองรับการใช้งานออฟไลน์ (Offline-First):</strong> ระบบถูกออกแบบให้บันทึกข้อมูลใน Local Storage เพื่อรองรับการทำงานในจุดอับสัญญาณของโรงไฟฟ้าและเหมืองแม่เมาะ</li>
                    </ul>
                </div>
            </div>
        `;
    }

    // -------------------------------------------------------------------------
    // FLOATING CART DRAWER (MATERIAL REQUISITION / E-PR)
    // -------------------------------------------------------------------------
    function renderCartDrawer() {
        const isCartOpen = state.isCartOpen;
        const totalItems = state.cart.reduce((sum, item) => sum + item.qty, 0);
        const totalPrice = state.cart.reduce((sum, item) => sum + (item.mat.price * item.qty), 0);

        return `
            <div id="smartops-cart-drawer" class="cart-drawer ${isCartOpen ? 'open' : ''}">
                <div class="cart-header">
                    <div class="cart-header-title">
                        <span style="font-size: 1.3rem;">🛒</span>
                        <h3>ตะกร้าขอเบิก/ขอซื้อพัสดุ (E-Requisition)</h3>
                    </div>
                    <button class="cart-close-btn" onclick="window.SmartOps.toggleCartDrawer()">✕</button>
                </div>

                <div class="cart-body">
                    ${state.cart.length === 0 ? `
                        <div class="cart-empty-state">
                            <span style="font-size: 3rem;">📦</span>
                            <p>ไม่มีรายการอะไหล่ในตะกร้า</p>
                            <span class="text-xs text-muted">กด "+ ใส่ตะกร้า" ในแท็บคลังพัสดุเพื่อเลือกรายการ</span>
                        </div>
                    ` : `
                        <div class="cart-items-list">
                            ${state.cart.map((item, idx) => `
                                <div class="cart-item">
                                    <div class="cart-item-info">
                                        <div class="font-bold text-sm">${escapeHtml(item.mat.name)}</div>
                                        <div class="text-xs text-muted">${escapeHtml(item.mat.matNo)} | 📍 ${escapeHtml(item.mat.bin)}</div>
                                        <div class="text-xs text-indigo font-bold">฿${formatNumber(item.mat.price)} / ${escapeHtml(item.mat.unit)}</div>
                                    </div>
                                    <div class="cart-qty-ctrl">
                                        <button class="btn-qty" onclick="window.SmartOps.changeCartQty(${idx}, -1)">-</button>
                                        <span class="qty-num">${item.qty}</span>
                                        <button class="btn-qty" onclick="window.SmartOps.changeCartQty(${idx}, 1)">+</button>
                                    </div>
                                    <button class="cart-item-del" onclick="window.SmartOps.removeCartItem(${idx})">🗑️</button>
                                </div>
                            `).join('')}
                        </div>

                        <!-- Form Requisition Target -->
                        <div class="cart-form-section">
                            <label class="form-label">ผูกกับใบสั่งงานซ่อม (Work Order):</label>
                            <select id="cart-wo-select" class="smartops-select w-100">
                                <option value="">-- ไม่ระบุ (เบิกสำรองคลังส่วนกลาง) --</option>
                                ${state.workOrders.filter(w => w.column !== 'completed').map(w => `
                                    <option value="${w.id}">${w.id}: ${w.title.slice(0, 35)}...</option>
                                `).join('')}
                            </select>

                            <label class="form-label mt-2">ศูนย์ต้นทุน (Cost Center):</label>
                            <input type="text" id="cart-costcenter-input" class="command-input w-100" value="4420-HRSG-MAINT" />
                        </div>
                    `}
                </div>

                ${state.cart.length > 0 ? `
                    <div class="cart-footer">
                        <div class="cart-summary-row">
                            <span>รวมทั้งหมด (${totalItems} ชิ้น):</span>
                            <strong class="text-indigo font-lg">฿${formatNumber(totalPrice)}</strong>
                        </div>
                        <button class="smartops-btn btn-primary-solid w-100 mt-2" onclick="window.SmartOps.submitRequisition()">
                            ยืนยันสร้างใบขอเบิก/ขอซื้อ (Submit E-PR) 🚀
                        </button>
                    </div>
                ` : ''}
            </div>
            ${isCartOpen ? `<div class="cart-backdrop" onclick="window.SmartOps.toggleCartDrawer()"></div>` : ''}
        `;
    }

    // =========================================================================
    // MODAL DIALOGS (NEW NOTIFICATION - IW21)
    // =========================================================================
    function openNewNotiModal() {
        const modalContainer = document.getElementById('smartops-modal-container');
        if (!modalContainer) return;

        modalContainer.innerHTML = `
            <div class="smartops-modal-overlay">
                <div class="smartops-modal-card">
                    <div class="modal-header">
                        <div class="modal-header-title">
                            <span class="modal-badge-tcode">SAP: IW21</span>
                            <h3>สร้างใบแจ้งเหตุขัดข้อง/แจ้งซ่อม (E-Notification)</h3>
                        </div>
                        <button class="modal-close-btn" onclick="window.SmartOps.closeModal()">✕</button>
                    </div>

                    <form id="new-noti-form" onsubmit="window.SmartOps.submitNewNoti(event)">
                        <div class="form-group">
                            <label class="form-label">จุดติดตั้ง / เครื่องจักร (Equipment Functional Location) *</label>
                            <select id="noti-equip-select" class="smartops-select w-100" required>
                                ${MASTER_EQUIPMENTS.map(eq => `
                                    <option value="${eq.id}">${eq.id}: ${eq.name} (${eq.area})</option>
                                `).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">ระดับความเร่งด่วน (Urgency Priority) *</label>
                            <div class="priority-radio-group">
                                <label class="radio-pill emergency">
                                    <input type="radio" name="noti-priority" value="emergency" />
                                    <span>🚨 ฉุกเฉินมาก (เสี่ยงทริป)</span>
                                </label>
                                <label class="radio-pill high">
                                    <input type="radio" name="noti-priority" value="high" checked />
                                    <span>⚡ สูง (ซ่อมภายใน 24 ชม.)</span>
                                </label>
                                <label class="radio-pill normal">
                                    <input type="radio" name="noti-priority" value="normal" />
                                    <span>ปกติ (ตามรอบบำรุงรักษา)</span>
                                </label>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">หัวข้อปัญหา / อาการชำรุด *</label>
                            <input 
                                type="text" 
                                id="noti-title-input" 
                                class="command-input w-100" 
                                placeholder="เช่น ปั๊ม BFP-A สั่นสะเทือนสูง, วาล์วไอน้ำมีเสียงฟู่, ปะเก็นรั่วซึม..." 
                                required 
                            />
                        </div>

                        <div class="form-group">
                            <label class="form-label">รายละเอียดเพิ่มเติมหน้างาน</label>
                            <textarea 
                                id="noti-desc-input" 
                                class="command-input w-100" 
                                rows="3" 
                                placeholder="ระบุการตรวจสอบเบื้องต้น ค่าพารามิเตอร์ที่อ่านได้ หรือข้อควรระวัง..."
                            ></textarea>
                        </div>

                        <div class="form-group">
                            <label class="form-label">รูปภาพหน้างาน (Optional Attachment)</label>
                            <div class="mock-upload-box">
                                <span>📸 คลิกเพื่อจำลองถ่ายรูปหรือแนบภาพหน้างาน</span>
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="smartops-btn btn-ghost" onclick="window.SmartOps.closeModal()">ยกเลิก</button>
                            <button type="submit" class="smartops-btn btn-primary-solid">
                                บันทึกสร้างใบแจ้งซ่อม (Create IW21) ✨
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    function closeModal() {
        const modalContainer = document.getElementById('smartops-modal-container');
        if (modalContainer) modalContainer.innerHTML = '';
    }

    // =========================================================================
    // EVENT HANDLERS & ACTIONS
    // =========================================================================
    function bindEvents() {
        // Tab buttons
        document.querySelectorAll('.smartops-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.getAttribute('data-tab');
                switchTab(tab);
            });
        });

        // Role select
        const roleSelect = document.getElementById('smartops-role-select');
        if (roleSelect) {
            roleSelect.addEventListener('change', (e) => {
                state.userRole = e.target.value;
                if (state.userRole === 'engineer') state.userName = 'วศ. เกรียงไกร (แผนกบำรุงรักษาโรงไฟฟ้า)';
                else if (state.userRole === 'warehouse') state.userName = 'จนท. สุรชัย (คลังพัสดุแม่เมาะ)';
                else state.userName = 'ผอ. สมบัติ (ผู้อำนวยการฝ่ายบำรุงรักษา)';
                saveState();
                renderApp();
                showToast(`👤 สลับบทบาทเป็น: ${roleSelect.options[roleSelect.selectedIndex].text}`);
            });
        }

        // Reset button
        const resetBtn = document.getElementById('smartops-reset-btn');
        if (resetBtn) resetBtn.addEventListener('click', resetData);

        // Command bar search
        const cmdInput = document.getElementById('smartops-command-input');
        const clearBtn = document.getElementById('smartops-command-clear');
        if (cmdInput) {
            cmdInput.addEventListener('input', (e) => {
                const val = e.target.value;
                state.searchTerm = val;
                if (clearBtn) {
                    if (val) clearBtn.classList.remove('hidden');
                    else clearBtn.classList.add('hidden');
                }

                // If user typed a direct T-Code match (e.g. "IW21", "ME51N")
                const matchTCode = SAP_TCODES.find(tc => tc.code.toLowerCase() === val.trim().toLowerCase());
                if (matchTCode) {
                    executeTCode(matchTCode.code);
                    cmdInput.value = '';
                    state.searchTerm = '';
                    return;
                }

                // If currently on inventory tab, re-render results smoothly
                if (state.activeTab === 'inventory') {
                    const grid = document.querySelector('.materials-grid');
                    if (grid) {
                        saveState();
                        renderApp();
                    }
                }
            });

            cmdInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const matchTCode = SAP_TCODES.find(tc => tc.code.toLowerCase() === cmdInput.value.trim().toLowerCase());
                    if (matchTCode) {
                        executeTCode(matchTCode.code);
                        cmdInput.value = '';
                        state.searchTerm = '';
                    } else {
                        // Switch to inventory to show search results
                        switchTab('inventory');
                    }
                }
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                state.searchTerm = '';
                saveState();
                renderApp();
            });
        }

        // T-Code badge pills
        document.querySelectorAll('.sugg-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                const tcode = e.currentTarget.getAttribute('data-tcode');
                executeTCode(tcode);
            });
        });
    }

    function switchTab(tabName) {
        state.activeTab = tabName;
        saveState();
        renderApp();
    }

    function executeTCode(tcode) {
        const found = SAP_TCODES.find(tc => tc.code.toUpperCase() === tcode.toUpperCase());
        if (!found) return;

        showToast(`⚡ เชื่อมโยงรหัส SAP: ${found.code} ➡️ ${found.modernName}`, 'info');

        if (found.action === 'openNewNoti') {
            state.activeTab = 'maintenance';
            saveState();
            renderApp();
            setTimeout(openNewNotiModal, 150);
        } else if (found.action === 'openCart') {
            state.activeTab = 'inventory';
            state.isCartOpen = true;
            saveState();
            renderApp();
        } else {
            state.activeTab = found.targetTab;
            saveState();
            renderApp();
        }
    }

    // Work order actions
    function moveWO(woId, newCol) {
        const wo = state.workOrders.find(w => w.id === woId);
        if (!wo) return;

        wo.column = newCol;
        wo.updatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');

        state.auditLogs.unshift({
            timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
            action: 'UPDATE_WO',
            doc: wo.id,
            user: state.userName,
            detail: `ปรับปรุงสถานะใบงานซ่อมเป็น: ${newCol}`
        });

        saveState();
        renderApp();
        showToast(`⚙️ ปรับปรุงสถานะ ${wo.id} เรียบร้อยแล้ว`);
    }

    function convertToWO(notiId) {
        const noti = state.notifications.find(n => n.id === notiId);
        if (!noti) return;

        const newWOId = `WO-${Math.floor(Math.random() * 900000) + 100000}`;
        const newWO = {
            id: newWOId,
            title: noti.title,
            equipId: noti.equipId,
            equipName: noti.equipName,
            priority: noti.priority,
            column: 'backlog',
            assignee: 'แผนกบำรุงรักษาเครื่องกล',
            plannedHours: 4,
            actualHours: 0,
            partsUsed: [],
            targetTime: 'ตามกำหนดการกะถัดไป',
            updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
        };

        noti.status = 'converted_to_wo';
        noti.workOrderId = newWOId;
        state.workOrders.unshift(newWO);

        state.auditLogs.unshift({
            timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
            action: 'CONVERT_WO',
            doc: newWOId,
            user: state.userName,
            detail: `แปลงใบแจ้งซ่อม ${noti.id} เป็นใบสั่งงานซ่อม (SAP: IW31)`
        });

        saveState();
        renderApp();
        showToast(`🎉 แปลงใบแจ้งซ่อมเป็นใบสั่งงาน ${newWOId} เรียบร้อยแล้ว!`);
    }

    function submitNewNoti(e) {
        e.preventDefault();
        const equipId = document.getElementById('noti-equip-select').value;
        const equipObj = MASTER_EQUIPMENTS.find(eq => eq.id === equipId);
        const priorityEl = document.querySelector('input[name="noti-priority"]:checked');
        const priority = priorityEl ? priorityEl.value : 'normal';
        const title = document.getElementById('noti-title-input').value.trim();
        const desc = document.getElementById('noti-desc-input').value.trim();

        if (!title) return;

        const notiId = `NOTI-2026-${Math.floor(Math.random() * 900) + 100}`;
        const newNoti = {
            id: notiId,
            equipId: equipId,
            equipName: equipObj ? equipObj.name : equipId,
            priority: priority,
            title: title,
            desc: desc || 'ตรวจพบความผิดปกติระหว่างการเดินเครื่อง',
            reporter: state.userName,
            createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            status: 'pending_wo',
            workOrderId: null
        };

        state.notifications.unshift(newNoti);

        state.auditLogs.unshift({
            timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
            action: 'CREATE_NOTI',
            doc: notiId,
            user: state.userName,
            detail: `สร้างใบแจ้งซ่อมใหม่: ${title}`
        });

        saveState();
        closeModal();
        renderApp();
        showToast(`✨ บันทึกใบแจ้งซ่อม ${notiId} (SAP: IW21) สำเร็จ!`);
    }

    // Material Cart
    function addToCart(matNo) {
        const mat = state.materials.find(m => m.matNo === matNo);
        if (!mat) return;

        const existing = state.cart.find(item => item.mat.matNo === matNo);
        if (existing) {
            existing.qty++;
        } else {
            state.cart.push({ mat: mat, qty: 1 });
        }

        saveState();
        renderApp();
        showToast(`🛒 เพิ่ม "${mat.name}" ลงในตะกร้าแล้ว`);
    }

    function changeCartQty(index, delta) {
        if (!state.cart[index]) return;
        state.cart[index].qty += delta;
        if (state.cart[index].qty <= 0) {
            state.cart.splice(index, 1);
        }
        saveState();
        renderApp();
    }

    function removeCartItem(index) {
        state.cart.splice(index, 1);
        saveState();
        renderApp();
    }

    function toggleCartDrawer() {
        state.isCartOpen = !state.isCartOpen;
        renderApp();
    }

    function setFilterCategory(catId) {
        state.filterCategory = catId;
        renderApp();
    }

    function submitRequisition() {
        if (state.cart.length === 0) return;

        const woSelect = document.getElementById('cart-wo-select');
        const costCenterInput = document.getElementById('cart-costcenter-input');
        const targetWo = woSelect ? woSelect.value : '';
        const costCenter = costCenterInput ? costCenterInput.value.trim() : '4420-HRSG-MAINT';

        const totalAmt = state.cart.reduce((sum, item) => sum + (item.mat.price * item.qty), 0);
        const reqDocNo = `PR-${Math.floor(Math.random() * 900000) + 100000}`;

        const newApproval = {
            id: `APR-PR-${Math.floor(Math.random() * 900) + 100}`,
            type: 'PR',
            docNo: reqDocNo,
            title: `ขอเบิก/ขอซื้ออะไหล่ ${state.cart.length} รายการ เข้าหน่วย ${costCenter}`,
            requester: state.userName,
            department: 'แผนกบำรุงรักษาโรงไฟฟ้า',
            amount: totalAmt,
            currency: 'THB',
            urgency: 'high',
            relatedRef: targetWo ? `ใบงาน ${targetWo}` : 'คลังสำรอง',
            status: 'pending',
            submittedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            notes: `รายการ: ${state.cart.map(i => `${i.mat.name} x ${i.qty}`).join(', ')}`
        };

        state.approvals.unshift(newApproval);
        state.cart = [];
        state.isCartOpen = false;

        state.auditLogs.unshift({
            timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
            action: 'SUBMIT_PR',
            doc: reqDocNo,
            user: state.userName,
            detail: `สร้างใบขอซื้อ E-PR มูลค่า ฿${formatNumber(totalAmt)} เข้าระบบรออนุมัติ`
        });

        saveState();
        renderApp();
        showToast(`🚀 ส่งคำขอ E-PR (${reqDocNo}) ไปยังศูนย์อนุมัติเรียบร้อยแล้ว!`);
    }

    // Approvals
    function approveApproval(apprId) {
        const item = state.approvals.find(a => a.id === apprId);
        if (!item) return;

        item.status = 'approved';
        item.approvedBy = state.userName;
        item.approvedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');

        state.auditLogs.unshift({
            timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
            action: 'APPROVE',
            doc: item.docNo,
            user: state.userName,
            detail: `อนุมัติเอกสาร ${item.docNo} (${item.title.slice(0, 40)}...)`
        });

        saveState();
        renderApp();
        showToast(`✅ อนุมัติเอกสาร ${item.docNo} สำเร็จ! ลงนามดิจิทัลเรียบร้อย`);
    }

    function rejectApproval(apprId) {
        const item = state.approvals.find(a => a.id === apprId);
        if (!item) return;

        const reason = prompt('กรุณาระบุเหตุผลในการส่งกลับแก้ไข / ปฏิเสธ:');
        if (reason === null) return; // user cancelled

        item.status = 'rejected';
        item.rejectReason = reason || 'ข้อมูลไม่ครบถ้วนตามระเบียบจัดซื้อ';
        item.rejectedBy = state.userName;

        state.auditLogs.unshift({
            timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
            action: 'REJECT',
            doc: item.docNo,
            user: state.userName,
            detail: `ส่งกลับเอกสาร ${item.docNo}: ${item.rejectReason}`
        });

        saveState();
        renderApp();
        showToast(`✕ ส่งกลับเอกสาร ${item.docNo} เรียบร้อยแล้ว`, 'error');
    }

    function jumpToWO(woId) {
        state.activeTab = 'maintenance';
        saveState();
        renderApp();
        setTimeout(() => {
            const card = document.getElementById(`wo-card-${woId}`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                card.classList.add('pulse-highlight');
                setTimeout(() => card.classList.remove('pulse-highlight'), 2000);
            }
        }, 200);
    }

    // Utility formatting
    function formatNumber(num) {
        return Number(num).toLocaleString('th-TH');
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Export Global API
    window.SmartOps = {
        switchTab: switchTab,
        executeTCode: executeTCode,
        openNewNotiModal: openNewNotiModal,
        closeModal: closeModal,
        submitNewNoti: submitNewNoti,
        moveWO: moveWO,
        convertToWO: convertToWO,
        addToCart: addToCart,
        changeCartQty: changeCartQty,
        removeCartItem: removeCartItem,
        toggleCartDrawer: toggleCartDrawer,
        setFilterCategory: setFilterCategory,
        submitRequisition: submitRequisition,
        approveApproval: approveApproval,
        rejectApproval: rejectApproval,
        jumpToWO: jumpToWO
    };

    window.initSmartOpsPage = function () {
        loadState();
        renderApp();
    };

})();

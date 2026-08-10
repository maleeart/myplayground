const hrsgConfig = {
    steps: [
        {
            id: 0,
            num: "ขั้นตอนที่ 1",
            title: "จุดเริ่มต้นกังหันแก๊ส (Gas Turbine)",
            desc: "อากาศและเชื้อเพลิงถูกอัดเผาไหม้ ขับเคลื่อนกังหันแก๊สผลิตไฟฟ้าเฟสแรก และปล่อยไอเสียร้อนจัด (580°C) ออกมา",
            highlightId: "comp-gas-turbine",
            activeFlows: ["flow-gas-duct-1", "flow-gas-duct-2"],
            metrics: { temp: "580 °C", press: "1.2 bar", flow: "650 kg/s", output: "150 MW" }
        },
        {
            id: 1,
            num: "ขั้นตอนที่ 2",
            title: "ส่งไอเสียร้อนเข้าสู่ระบบ HRSG",
            desc: "ไอเสียร้อนจัดจากกังหันแก๊สไหลผ่านโครงสร้างแนวตั้งของ HRSG ถ่ายเทความร้อนให้ท่ออุปกรณ์ต่างๆ ก่อนออกปล่องระบาย",
            highlightId: "comp-hrsg-body",
            activeFlows: ["flow-gas-duct-2", "flow-gas-in-hrsg", "flow-gas-stack"],
            metrics: { temp: "580°C → 105°C", press: "ความดันต่ำ", flow: "650 kg/s", output: "นำความร้อนกลับมาใช้" }
        },
        {
            id: 2,
            num: "ขั้นตอนที่ 3",
            title: "อุ่นน้ำป้อนที่เครื่อง Economizer",
            desc: "น้ำป้อนเย็น (Feedwater) ถูกฉีดเข้า Economizer ซึ่งอยู่ท้ายสุดเพื่อดึงความร้อนไอเสียช่วงสุดท้ายมาอุ่นน้ำให้ร้อนจัดก่อนเข้ากลองไอน้ำ",
            highlightId: "comp-economizer",
            activeFlows: ["flow-feedwater-in", "flow-eco-tubes", "flow-eco-to-drum"],
            metrics: { temp: "130°C → 280°C", press: "125 bar", flow: "220 t/h", output: "ประสิทธิภาพเพิ่ม +9%" }
        },
        {
            id: 3,
            num: "ขั้นตอนที่ 4",
            title: "ต้มน้ำและแยกไอที่ Evaporator & Drum",
            desc: "น้ำจาก Steam Drum ไหลเวียนเข้า Evaporator รับความร้อนจนเดือดกลายเป็นไออิ่มตัว (Saturated Steam) แล้วลอยตัวกลับเข้าถังแยกเฟส",
            highlightId: "comp-evaporator",
            activeFlows: ["flow-drum-downcomer", "flow-eva-tubes", "flow-eva-to-drum"],
            metrics: { temp: "315 °C", press: "110 bar", flow: "ธรรมชาติหมุนเวียน", output: "ไอน้ำอิ่มตัว 99.9%" }
        },
        {
            id: 4,
            num: "ขั้นตอนที่ 5",
            title: "ผลิตไอน้ำร้อนจัดที่ Superheater",
            desc: "ไอน้ำแห้งจาก Steam Drum ไหลเข้าชุดท่อ Superheater รับไอเสียร้อนจัดหน้าสุด ทำให้มีอุณหภูมิสูงขึ้นเป็นไอน้ำร้อนจัด (Superheated Steam)",
            highlightId: "comp-superheater",
            activeFlows: ["flow-drum-to-sh", "flow-sh-tubes", "flow-sh-to-turbine"],
            metrics: { temp: "540 °C", press: "105 bar", flow: "220 t/h", output: "พลังงานจลน์สูงสุด" }
        },
        {
            id: 5,
            num: "ขั้นตอนที่ 6",
            title: "ขับเคลื่อนกังหันไอน้ำ (Steam Turbine)",
            desc: "ไอน้ำร้อนจัดแรงดันสูงมากวิ่งไปฉีดขับใบพัดกังหันไอน้ำเพื่อหมุนเครื่องกำเนิดไฟฟ้า ผลิตไฟฟ้าเฟสสองโดยไม่ต้องใช้เชื้อเพลิงเพิ่ม",
            highlightId: "comp-steam-turbine",
            activeFlows: ["flow-sh-to-turbine", "flow-turbine-exhaust"],
            metrics: { temp: "538 °C", press: "102 bar → สุญญากาศ", flow: "3,000 rpm", output: "75 MW" }
        },
        {
            id: 6,
            num: "ขั้นตอนที่ 7",
            title: "ควบแน่นและปั๊มกลับวนลูปปิด",
            desc: "ไอเสียจากกังหันควบแน่นเป็นน้ำป้อนบริสุทธิ์ที่ Condenser และถูกปั๊มน้ำแรงดันสูงส่งกลับไปยัง Economizer เพื่อเริ่มขั้นตอนใหม่อีกครั้ง",
            highlightId: "comp-condenser",
            activeFlows: ["flow-condensate-pump", "flow-feedwater-in"],
            metrics: { temp: "42 °C", press: "-0.92 bar (สุญญากาศ)", flow: "250 m³/h", output: "การทำงานระบบปิด 100%" }
        }
    ],
    components: {
        "comp-gas-turbine": {
            title: "กังหันแก๊ส (Gas Turbine)",
            desc: "หน่วยผลิตไฟฟ้าหลักที่เผาไหม้แก๊สธรรมชาติกับอากาศแรงดันสูง ผลิตกระแสไฟฟ้าเฟสแรก และระบายก๊าซไอเสียพลังงานความร้อนสูงป้อนเข้าสู่ระบบ HRSG",
            specs: {
                "อุณหภูมิไอเสีย": "580 °C",
                "อัตราการไหลของแก๊ส": "650 kg/s",
                "กำลังการผลิตไฟฟ้า": "150 MW",
                "ประสิทธิภาพความร้อน": "ประมาณ 38%"
            }
        },
        "comp-superheater": {
            title: "เครื่องเพิ่มความร้อนไอน้ำ (Superheater)",
            desc: "ชุดท่อแลกเปลี่ยนความร้อนที่ติดตั้งอยู่หน้าสุดของ HRSG ทำหน้าที่รับความร้อนสูงจัดจากไอเสียแก๊สโดยตรง เพื่อเพิ่มอุณหภูมิไออิ่มตัวให้กลายเป็นไอน้ำแห้งร้อนจัด (Superheated Steam) แรงดันสูง ป้องกันความเสียหายจากละอองน้ำที่จะไปทำลายใบพัดกังหันไอน้ำ",
            specs: {
                "อุณหภูมิไอน้ำขาออก": "540 °C",
                "ความดันไอน้ำใช้งาน": "105 bar",
                "อัตราการผลิตไอน้ำ": "220 ตัน/ชั่วโมง",
                "วัสดุทำท่อรับความร้อน": "Alloy Steel (T91/T92)"
            }
        },
        "comp-evaporator": {
            title: "เครื่องต้มน้ำ/ผลิตไอน้ำ (Evaporator)",
            desc: "ส่วนกลางของ HRSG ทำหน้าที่แลกเปลี่ยนความร้อนอย่างหนาแน่นเพื่อต้มน้ำร้อนจัดในท่อจนกลายเป็นไอน้ำอิ่มตัว (Saturated Steam) โดยระบบจะป้อนน้ำร้อนจาก Steam Drum ไหลวนเวียนผ่านแผงท่อนี้อย่างทั่วถึง",
            specs: {
                "อุณหภูมิใช้งาน": "315 °C",
                "การถ่ายเทความร้อน": "85 MW",
                "รูปแบบการไหลเวียน": "หมุนเวียนตามธรรมชาติ (Natural Circulation)",
                "พื้นที่ผิวสัมผัสท่อ": "12,500 ตารางเมตร"
            }
        },
        "comp-economizer": {
            title: "เครื่องอุ่นน้ำป้อน (Economizer)",
            desc: "ชุดท่อแลกเปลี่ยนความร้อนส่วนท้ายสุดของระบบ HRSG ดึงความร้อนที่เหลือจากแก๊สไอเสียที่กำลังจะออกปล่อง (ช่วงประมาณ 200°C) มาอุ่นน้ำป้อน (Feedwater) ก่อนส่งเข้า Steam Drum ช่วยให้ประหยัดพลังงานความร้อนป้อนและเพิ่มประสิทธิภาพรวม",
            specs: {
                "อุณหภูมิน้ำเข้า": "130 °C",
                "อุณหภูมิน้ำอุ่นออก": "280 °C",
                "ความดันน้ำใช้งาน": "125 bar",
                "สัดส่วนการช่วยประหยัด": "เพิ่มประสิทธิภาพโรงไฟฟ้า 8-10%"
            }
        },
        "comp-steam-drum": {
            title: "ถังไอน้ำ (Steam Drum)",
            desc: "ถังขนาดใหญ่ติดตั้งที่ส่วนบนของ HRSG ทำหน้าที่เป็นตัวกลางแยกเฟสระหว่างน้ำร้อนและไอน้ำ โดยจะคัดแยกไอน้ำแห้งส่งต่อไปยัง Superheater และจ่ายน้ำส่วนที่เหลือที่เป็นของเหลวลงสู่ Evaporator เพื่อต้มซ้ำ",
            specs: {
                "ความจุภายใน": "45 ลูกบาศก์เมตร",
                "ความดันออกแบบ": "135 bar",
                "อุปกรณ์แยกไอภายใน": "Cyclone Separators & Demister",
                "สัดส่วนน้ำ / ไอ": "50% / 50%"
            }
        },
        "comp-steam-turbine": {
            title: "กังหันไอน้ำ (Steam Turbine)",
            desc: "รับไอน้ำร้อนจัดความดันสูงจาก Superheater มาฉีดพ่นขับเคลื่อนใบพัดกังหันให้หมุนด้วยความเร็วสูง เชื่อมต่อกับเครื่องกำเนิดไฟฟ้าผลิตกระแสไฟฟ้าเพิ่มได้อีกราว 50% ของกำลังการผลิตกังหันแก๊ส โดยไม่ต้องเผาผลาญเชื้อเพลิงเพิ่ม",
            specs: {
                "ความเร็วรอบใช้งาน": "3,000 rpm",
                "ความดันไอน้ำเข้า": "102 bar",
                "กำลังการผลิตไฟฟ้า": "75 MW",
                "เกรดความร้อนไอน้ำเข้า": "High Pressure (HP) Stage"
            }
        },
        "comp-condenser": {
            title: "เครื่องควบแน่นไอน้ำ (Condenser)",
            desc: "ทำหน้าที่ลดอุณหภูมิไอน้ำไอเสียจากกังหันไอน้ำให้กลั่นตัวกลับเป็นน้ำป้อนบริสุทธิ์ (Condensate) ด้วยการแลกเปลี่ยนความร้อนกับน้ำหล่อเย็นภายนอก พร้อมสร้างสภาวะสุญญากาศช่วยดูดดึงไอน้ำขับเคลื่อนกังหันให้มีกำลังสูงสุด",
            specs: {
                "ระดับสุญญากาศห้องควบ": "-0.92 bar",
                "อุณหภูมิน้ำควบแน่น": "42 °C",
                "อัตราไหลน้ำหล่อเย็น": "15,000 m³/h",
                "ชนิดทางวิศวกรรม": "Shell and Tube Condenser"
            }
        },
        "comp-feedwater-pump": {
            title: "ปั๊มน้ำป้อนระบบ (Feedwater Pump)",
            desc: "ปั๊มน้ำแรงดันสูง ทำหน้าที่อัดน้ำป้อนบริสุทธิ์จากถังพักน้ำส่งกลับขึ้นไปป้อนเข้าสู่เครื่อง Economizer ของระบบ HRSG เพื่อหมุนเวียนเริ่มวงจรใหม่อีกครั้งอย่างต่อเนื่อง",
            specs: {
                "แรงดันส่งออกปั๊ม": "130 bar",
                "อัตราการไหลส่งน้ำ": "250 m³/h",
                "กำลังขับเคลื่อนมอเตอร์": "1,200 kW",
                "ประเภทปั๊ม": "Multistage Centrifugal Pump"
            }
        },
        "comp-chimney": {
            title: "ปล่องไอเสีย (Exhaust Stack)",
            desc: "ปล่องท้ายสุดของ HRSG ทำหน้าที่ระบายแก๊สไอเสียที่ดึงความร้อนออกไปใช้งานหมดแล้ว (อุณหภูมิเหลือประมาณ 105°C) ออกสู่ชั้นบรรยากาศอย่างปลอดภัย พร้อมติดตั้งเซ็นเซอร์ตรวจวัดมลพิษตลอด 24 ชั่วโมง",
            specs: {
                "ความสูงโครงสร้าง": "60 เมตร",
                "อุณหภูมิไอเสียระบายออก": "105 °C",
                "ระบบตรวจสอบมลพิษ": "CEMS (Continuous Emission Monitoring)"
            }
        },
        "comp-hrsg-body": {
            title: "เครื่องผลิตไอน้ำดึงความร้อนกลับมาใช้ (HRSG)",
            desc: "หม้อไอน้ำขนาดใหญ่ที่รับความร้อนทิ้งจากกังหันแก๊สมาผลิตไอน้ำไปเดินเครื่องกังหันไอน้ำ ประกอบด้วย Economizer, Evaporator, Steam Drum, และ Superheater",
            specs: {
                "ประเภทเครื่อง": "Horizontal Type, Tri-Pressure",
                "ความร้อนนำกลับมาใช้": "ดึงกลับมาราว 70% ของพลังงานเสีย",
                "การแลกเปลี่ยนความร้อน": "ผ่านขดท่อครีบหนาแน่น (Finned Tubes)",
                "ระบบโครงสร้าง": "รับความร้อนทางเดียว (Exhaust Gas Path)"
            }
        }
    }
};

const fgdConfig = {
    steps: [
        {
            id: 0,
            num: "ขั้นตอนที่ 1",
            title: "ก๊าซไอเสียมีซัลเฟอร์ (Raw Flue Gas)",
            desc: "ก๊าซไอเสียดิบจากการเผาไหม้ถ่านหินลิกไนต์ที่ผ่านเครื่องดักฝุ่นไฟฟ้า (ESP) เข้าสู่ท่อทางเข้าของ FGD โดยมี SO2 ปนเปื้อนสูง",
            highlightId: "comp-fgd-inlet",
            activeFlows: ["flow-fgd-gas-in", "flow-fgd-gas-buf"],
            metrics: { temp: "135 °C", press: "-0.5 kPa", flow: "950 m³/s", output: "SO2: ~ 2,500 ppm" }
        },
        {
            id: 1,
            num: "ขั้นตอนที่ 2",
            title: "เพิ่มแรงขับด้วยพัดลม Booster Fan",
            desc: "Booster Fan เพิ่มแรงลมขับส่งไอเสียดิบปริมาณมากเข้าสู่ด้านล่างหอดูดซับ (Absorber Tower) อย่างเสถียร",
            highlightId: "comp-fgd-fan",
            activeFlows: ["flow-fgd-gas-buf", "flow-fgd-gas-tower"],
            metrics: { temp: "135 °C", press: "+4.5 kPa", flow: "950 m³/s", output: "ความเร็วรอบใบพัดสูง" }
        },
        {
            id: 2,
            num: "ขั้นตอนที่ 3",
            title: "ฉีดพ่นน้ำปูนหินปูน (Limestone Spray)",
            desc: "น้ำปูนหินปูน (Limestone Slurry) ความเข้มข้นสูงถูกฉีดจาก Spray Headers ลงมาด้านล่างเพื่อกระจายพื้นที่ทำปฏิกิริยากับก๊าซ",
            highlightId: "comp-fgd-sprays",
            activeFlows: ["flow-limestone-pump", "flow-limestone-sprays"],
            metrics: { temp: "สเปรย์ระบายความร้อน", press: "0.8 bar", flow: "16,000 m³/h", output: "pH สารละลาย: 5.5 - 6.2" }
        },
        {
            id: 3,
            num: "ขั้นตอนที่ 4",
            title: "ทำปฏิกิริยาเคมีดูดซับ SO2 (Absorption)",
            desc: "ก๊าซ SO2 สัมผัสละอองปูน เกิดปฏิกิริยาทำลายกรดกลายเป็นสารละลายกึ่งยิปซัม (Calcium Sulfite) ตกลงสู่ถังก้นหอดูดซับ",
            highlightId: "comp-fgd-absorber",
            activeFlows: ["flow-fgd-gas-tower", "flow-limestone-sprays", "flow-gypsum-recycle"],
            metrics: { temp: "ลดเหลือ ~ 50 °C", press: "ดรอปเล็กน้อย", flow: "ก๊าซยกตัวขึ้นบน", output: "ดูดซับ SO2 ขจัดได้ > 96%" }
        },
        {
            id: 4,
            num: "ขั้นตอนที่ 5",
            title: "เป่าอากาศอัดทำปฏิกิริยาออกซิเดชัน",
            desc: "เครื่องเป่าลม Oxidation Air Blower อัดอากาศใส่ถังก้นหอเพื่อแปลงแคลเซียมซัลไฟต์ให้กลายเป็นแคลเซียมซัลเฟต (ยิปซัมสมบูรณ์)",
            highlightId: "comp-fgd-blower",
            activeFlows: ["flow-air-blower", "flow-air-bubbles"],
            metrics: { temp: "อุณหภูมิก้นหอ 50°C", press: "1.1 bar", flow: "120 Nm³/min", output: "เปลี่ยนโครงสร้างเป็น ยิปซัม" }
        },
        {
            id: 5,
            num: "ขั้นตอนที่ 6",
            title: "สลัดรีดน้ำยิปซัมไปใช้งานต่อ (Dewatering)",
            desc: "ปั๊มดูดตะกอนยิปซัมข้นก้นหอส่งเข้าเครื่องรีดสลัดแยกน้ำเพื่อผลิตแผ่นยิปซัมหรือปูนซีเมนต์ และเอาน้ำกลับมาใช้ใหม่",
            highlightId: "comp-fgd-dewatering",
            activeFlows: ["flow-gypsum-out", "flow-gypsum-belt"],
            metrics: { temp: "อุณหภูมิปกติ", press: "สุญญากาศสายพาน", flow: "48 ตัน/ชม.", output: "ความชื้นต่ำกว่า 10%" }
        },
        {
            id: 6,
            num: "ขั้นตอนที่ 7",
            title: "ดักละอองน้ำและปล่อยก๊าซสะอาดออก stack",
            desc: "ก๊าซสะอาดลอยตัวผ่าน Mist Eliminator ดักละอองน้ำปูนก่อนระบายออกทางปล่องควันเปียก (Wet Stack) สู่ชั้นบรรยากาศอย่างสะอาด",
            highlightId: "comp-fgd-mist",
            activeFlows: ["flow-fgd-gas-clean", "flow-fgd-gas-stack"],
            metrics: { temp: "50 °C (ควันขาวชื้น)", press: "ปกติ", flow: "920 m³/s", output: "SO2 ปล่อยออก: < 50 ppm" }
        }
    ],
    components: {
        "comp-fgd-inlet": {
            title: "ท่อก๊าซไอเสียเข้า (Flue Gas Inlet)",
            desc: "ท่อนำส่งก๊าซไอเสียที่ผ่านการดักจับฝุ่นละอองจากเครื่องตกตะกอนไฟฟ้าสถิต (ESP) ของโรงไฟฟ้าถ่านหินแม่เมาะ เพื่อนำเข้าสู่ระบบบำบัดมลพิษ",
            specs: {
                "ปริมาณ SO2 ขาเข้า": "2,500 ppm",
                "อัตราการไหลก๊าซ": "950 m³/s",
                "อุณหภูมิก๊าซขาเข้า": "135 °C",
                "ปริมาณฝุ่นหลงเหลือ": "< 40 mg/Nm³"
            }
        },
        "comp-fgd-fan": {
            title: "พัดลมเพิ่มแรงดันไอเสีย (Booster Fan)",
            desc: "พัดลมขับแรงดันส่งก๊าซไอเสียขนาดใหญ่ เพื่อเอาชนะความต้านทานแรงดันลมภายในหอดูดซับและระบบท่อส่งก๊าซ ช่วยดึงไอเสียดิบไม่ให้ตีกลับไปกระทบหม้อต้มโรงไฟฟ้า",
            specs: {
                "กำลังมอเตอร์ขับเคลื่อน": "3,200 kW",
                "ประเภทพัดลม": "Axial Fan (ปรับมุมใบพัดขณะหมุน)",
                "แรงดันส่งดัน": "+4.5 kPa",
                "การควบคุมความเร็ว": "ชุดควบคุม VFD"
            }
        },
        "comp-fgd-absorber": {
            title: "หอดูดซับซัลเฟอร์ (Absorber Tower)",
            desc: "หอคอยทำปฏิกิริยาหลักแบบเปียก (Wet Limestone-Gypsum) ออกแบบให้ก๊าซไอเสียไหลสัมผัสอย่างใกล้ชิดกับละอองสารละลายหินปูน เพื่อสลายกำจัดก๊าซซัลเฟอร์ไดออกไซด์",
            specs: {
                "ความสูงรวมหอคอย": "45 เมตร",
                "เส้นผ่านศูนย์กลาง": "18 เมตร",
                "ประสิทธิภาพกำจัด SO2": "96 - 98%",
                "วัสดุเคลือบป้องกันกรด": "Alloy 2205 และยางสังเคราะห์หนาพิเศษ"
            }
        },
        "comp-fgd-limestone": {
            title: "ระบบผสมเตรียมหินปูน (Limestone Slurry System)",
            desc: "ถังเตรียมและถังเก็บหินปูนบดละเอียดผสมน้ำป้อน ช่วยกวนผสมรักษาความเข้มข้นที่เหมาะสมเพื่อเตรียมจ่ายจ่ายน้ำหินปูนเข้าหอดูดซับตามสัดส่วนปริมาณซัลเฟอร์ไอเสียจริง",
            specs: {
                "อัตราการจ่ายใช้หินปูน": "35 ตัน/ชั่วโมง",
                "ความเข้มข้นสารละลาย": "20 - 30% Solid by Weight",
                "ความละเอียดหินปูน": "95% ผ่านตะแกรง 325 mesh",
                "ความบริสุทธิ์หินปูน (CaCO3)": "> 90%"
            }
        },
        "comp-fgd-sprays": {
            title: "หัวฉีดสเปรย์หินปูน (Spray Headers & Pumps)",
            desc: "ชุดท่อจ่ายสารละลายพร้อมปั๊มสูบจ่ายน้ำปูนปริมาณสูงขึ้นไปฉีดสเปรย์กระจายลงมา ทำหน้าที่จับก๊าซ SO2 ทั่วถึงทุกตารางเซนติเมตรภายในหอดูดซับ",
            specs: {
                "จำนวนชั้นหัวฉีด": "4 ชั้นทำงานหลัก",
                "รูปแบบสเปรย์ฉีด": "Hollow Cone (ละอองทรงกรวยกลวงสัมผัสดีสุด)",
                "กำลังปั๊มจ่ายต่อชั้น": "4,000 m³/h (x4 เครื่อง)",
                "ความดันพ่นสเปรย์": "0.8 bar"
            }
        },
        "comp-fgd-blower": {
            title: "เครื่องเป่าอากาศออกซิเดชัน (Oxidation Air Blower)",
            desc: "เป่าอากาศป้อนเข้าไปที่ถังทำปฏิกิริยาด้านล่างหอคอย (Reaction Tank) เพื่อออกซิไดซ์แคลเซียมซัลไฟต์ให้เปลี่ยนสภาพสมบูรณ์กลายเป็นยิปซัมที่มีมูลค่าเชิงพาณิชย์",
            specs: {
                "กำลังผลิตลมเครื่องเป่า": "120 Nm³/min",
                "ความดันอากาศจ่าย": "1.1 bar",
                "มอเตอร์ขับเคลื่อน": "450 kW",
                "ชนิดเครื่องเป่าลม": "Centrifugal Blower"
            }
        },
        "comp-fgd-dewatering": {
            title: "ระบบผลิตสลัดน้ำยิปซัม (Gypsum Dewatering)",
            desc: "เครื่องสลัดน้ำแยกความชื้นระบบแรงเหวี่ยง Hydrocyclone และเครื่องกรองสายพานสุญญากาศรีดน้ำ เพื่อผลิตยิปซัมแห้งและดึงน้ำกลับเข้าระบบประหยัดการใช้น้ำป้อน",
            specs: {
                "กำลังผลิตยิปซัมแห้ง": "48 ตัน/ชั่วโมง",
                "ความชื้นผลิตภัณฑ์ยิปซัม": "< 10% H2O",
                "อัตราดึงน้ำน้ำกลับมาหมุนเวียน": "90%",
                "การนำไปใช้ต่อ": "อุตสาหกรรมปูนซีเมนต์และแผ่นยิปซัมบอร์ด"
            }
        },
        "comp-fgd-mist": {
            title: "แผงดักละอองน้ำ (Mist Eliminator)",
            desc: "แผงพลาสติกชนิดฟันปลาคู่ ติดตั้งก่อนทางก๊าซออก เพื่อคัดแยกละอองน้ำปูนเหลวที่เกาะไปกับก๊าซ ไม่ให้ระเหยหลุดรอดกัดกร่อนปล่องระบายควันสะดุด",
            specs: {
                "จำนวนชั้นดักกรอง": "2 ชั้นขัดขวางทิศทาง (Chevron)",
                "ประสิทธิภาพจับละอองน้ำ": "99.9% (ขนาดใหญ่กว่า 20 ไมครอน)",
                "น้ำล้างแผงดักกรอง": "ล้างอัตโนมัติเป็นระยะเพื่อป้องกันคราบสะสม",
                "วัสดุแผงกรอง": "Polypropylene (PP)"
            }
        },
        "comp-fgd-stack": {
            title: "ปล่องระบายไอเสียเปียก (Exhaust Wet Stack)",
            desc: "ปล่องปล่อยก๊าซไอเสียสะอาดของโรงไฟฟ้าแม่เมาะที่ผ่านการบำบัดขจัดซัลเฟอร์และฝุ่นเปียกจนสะอาดตามเกณฑ์มาตรฐานความปลอดภัยสิ่งแวดล้อมโลกแล้ว",
            specs: {
                "ความสูงปล่องระบาย": "150 เมตร",
                "อุณหภูมิก๊าซปล่อยออก": "50 °C (ไอชื้นควันสีขาวระเหยง่าย)",
                "ค่า SO2 ที่ระบายออก": "< 50 ppm (เกณฑ์มาตรฐาน < 180 ppm)",
                "ระบบวัดมลพิษ": "CEMS ทำงานและรายงานผลต่อเนื่อง"
            }
        }
    }
};

let currentTab = "hrsg";
let currentStep = 0;
let isPlaying = false;
let playInterval = null;
let currentHighlightedElement = null;

document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    initControls();
    initDiagramInteractions();
    initNavigation();
    initAffiliateConverter();
    initAffiliateAnalytics();
    initCashflowGame();
    switchView("home"); // Start at the landing page
});

function initTabs() {
    const btnHrsg = document.getElementById("tab-hrsg");
    const btnFgd = document.getElementById("tab-fgd");

    btnHrsg.addEventListener("click", () => {
        if (currentTab === "hrsg") return;
        switchTab("hrsg");
    });

    btnFgd.addEventListener("click", () => {
        if (currentTab === "fgd") return;
        switchTab("fgd");
    });
}

function switchTab(tabName) {
    currentTab = tabName;
    
    // Update active tab buttons
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.getElementById(`tab-${tabName}`).classList.add("active");

    // Toggle SVG displays
    if (tabName === "hrsg") {
        document.getElementById("svg-hrsg").classList.remove("hidden");
        document.getElementById("svg-fgd").classList.add("hidden");
    } else {
        document.getElementById("svg-hrsg").classList.add("hidden");
        document.getElementById("svg-fgd").classList.remove("hidden");
    }

    // Reset details overlay
    document.getElementById("info-overlay").classList.remove("active");
    if (currentHighlightedElement) {
        currentHighlightedElement.classList.remove("highlighted");
        currentHighlightedElement = null;
    }

    if (isPlaying) pauseAutoplay();
    
    loadSystem(tabName);
}

function loadSystem(systemName) {
    const config = systemName === "hrsg" ? hrsgConfig : fgdConfig;
    
    // Update sidebar title and description
    if (systemName === "hrsg") {
        document.getElementById("sidebar-title").innerText = "ระบบต้มน้ำด้วยความร้อนทิ้ง (HRSG)";
        document.getElementById("sidebar-desc").innerText = "เรียนรู้การทำงานของเครื่องต้มน้ำด้วยก๊าซร้อนทิ้งของโรงไฟฟ้ากังหันแก๊สแบบขั้นตอนต่อขั้นตอน กดเลือกดูอุปกรณ์ หรือคลิกปุ่ม Auto Play";
    } else {
        document.getElementById("sidebar-title").innerText = "ระบบกำจัด SO2 (Wet FGD - แม่เมาะ)";
        document.getElementById("sidebar-desc").innerText = "เรียนรู้การทำงานของระบบบำบัดซัลเฟอร์ไดออกไซด์แบบเปียกของโรงไฟฟ้าแม่เมาะแบบขั้นตอนต่อขั้นตอน กดเลือกดูอุปกรณ์ หรือคลิกปุ่ม Auto Play";
    }
    
    // 1. Initialize steps list on sidebar
    const stepsListContainer = document.getElementById("steps-list");
    stepsListContainer.innerHTML = "";

    config.steps.forEach((step, idx) => {
        const card = document.createElement("div");
        card.className = "step-card";
        card.id = `step-card-${idx}`;
        card.innerHTML = `
            <div class="step-header">
                <span class="step-num">${step.num}</span>
            </div>
            <div class="step-title">${step.title}</div>
            <div class="step-desc">${step.desc}</div>
        `;
        card.addEventListener("click", () => {
            setStep(idx);
            if (isPlaying) pauseAutoplay();
        });
        stepsListContainer.appendChild(card);
    });

    // 2. Load step 0
    setStep(0);
}

function initControls() {
    const btnPrev = document.getElementById("btn-prev");
    const btnNext = document.getElementById("btn-next");
    const btnPlay = document.getElementById("btn-play");
    const btnOverview = document.getElementById("btn-overview");
    const speedSlider = document.getElementById("speed-slider");
    const infoClose = document.getElementById("info-close");

    btnPrev.addEventListener("click", () => {
        const config = currentTab === "hrsg" ? hrsgConfig : fgdConfig;
        setStep((currentStep - 1 + config.steps.length) % config.steps.length);
        if (isPlaying) pauseAutoplay();
    });

    btnNext.addEventListener("click", () => {
        const config = currentTab === "hrsg" ? hrsgConfig : fgdConfig;
        setStep((currentStep + 1) % config.steps.length);
        if (isPlaying) pauseAutoplay();
    });

    btnPlay.addEventListener("click", () => {
        if (isPlaying) {
            pauseAutoplay();
        } else {
            startAutoplay();
        }
    });

    btnOverview.addEventListener("click", () => {
        showOverview();
        if (isPlaying) pauseAutoplay();
    });

    speedSlider.addEventListener("input", (e) => {
        const val = e.target.value;
        document.documentElement.style.setProperty("--flow-speed-scale", val);
        document.getElementById("speed-display").innerText = val + "x";
    });

    infoClose.addEventListener("click", () => {
        document.getElementById("info-overlay").classList.remove("active");
        if (currentHighlightedElement) {
            currentHighlightedElement.classList.remove("highlighted");
            currentHighlightedElement = null;
        }
    });
}

function initDiagramInteractions() {
    const tooltip = document.getElementById("diagram-tooltip");
    const container = document.getElementById("canvas-container");

    // We listen on the container for clicks and hovers to handle components from both SVGs dynamically
    container.addEventListener("click", (e) => {
        // Find if we clicked on an interactive component
        const interactiveGroup = e.target.closest(".interactive-component");
        if (interactiveGroup) {
            e.stopPropagation();
            showComponentDetails(interactiveGroup.id);
        } else {
            // Clicked empty space: close overlay
            document.getElementById("info-overlay").classList.remove("active");
            if (currentHighlightedElement) {
                currentHighlightedElement.classList.remove("highlighted");
                currentHighlightedElement = null;
            }
        }
    });

    container.addEventListener("mousemove", (e) => {
        const interactiveGroup = e.target.closest(".interactive-component");
        if (interactiveGroup) {
            const config = currentTab === "hrsg" ? hrsgConfig : fgdConfig;
            const details = config.components[interactiveGroup.id];
            
            if (details) {
                const rect = container.getBoundingClientRect();
                const x = e.clientX - rect.left + 15;
                const y = e.clientY - rect.top + 15;
                
                tooltip.style.left = `${x}px`;
                tooltip.style.top = `${y}px`;
                tooltip.style.opacity = "1";
                tooltip.innerText = details.title;
                return;
            }
        }
        tooltip.style.opacity = "0";
    });

    container.addEventListener("mouseleave", () => {
        tooltip.style.opacity = "0";
    });
}

function setStep(stepIndex) {
    currentStep = stepIndex;
    const config = currentTab === "hrsg" ? hrsgConfig : fgdConfig;
    const step = config.steps[stepIndex];

    // Update active class in sidebar
    document.querySelectorAll(".step-card").forEach((card, idx) => {
        if (idx === stepIndex) {
            card.classList.add("active");
            if (window.innerWidth > 1024) {
                card.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        } else {
            card.classList.remove("active");
        }
    });

    // Update bottom step info bar
    document.getElementById("current-step-num").innerText = step.num;
    document.getElementById("current-step-title").innerText = step.title;
    document.getElementById("current-step-desc").innerText = step.desc;

    // Update floating HUD overlay on diagram with smooth slide-in animation
    const hud = document.getElementById("step-hud");
    hud.classList.remove("hud-animate");
    document.getElementById("hud-step-num").innerText = step.num;
    document.getElementById("hud-step-title").innerText = step.title;
    document.getElementById("hud-step-desc").innerText = step.desc;
    void hud.offsetWidth; // Trigger reflow
    hud.classList.add("hud-animate");

    // Highlight the active component in active SVG (Spotlight effect)
    const svgElem = currentTab === "hrsg" ? document.getElementById("svg-hrsg") : document.getElementById("svg-fgd");
    const otherSvgElem = currentTab === "hrsg" ? document.getElementById("svg-fgd") : document.getElementById("svg-hrsg");
    
    otherSvgElem.classList.remove("has-highlight");
    
    document.querySelectorAll(".interactive-component").forEach(comp => {
        comp.classList.remove("highlighted");
    });
    
    const activeComp = document.getElementById(step.highlightId);
    if (activeComp) {
        activeComp.classList.add("highlighted");
        currentHighlightedElement = activeComp;
        svgElem.classList.add("has-highlight");
    } else {
        svgElem.classList.remove("has-highlight");
    }

    // Set active flows in active SVG
    document.querySelectorAll(".flow-path").forEach(flow => {
        flow.classList.remove("active");
    });
    
    step.activeFlows.forEach(flowId => {
        const flows = document.querySelectorAll(`.${flowId}`);
        flows.forEach(f => f.classList.add("active"));
    });

    // Show details for primary component
    showComponentDetails(step.highlightId, true);
}

function showComponentDetails(compId, isStepChange = false) {
    const config = currentTab === "hrsg" ? hrsgConfig : fgdConfig;
    const details = config.components[compId];
    if (!details) return;

    // Highlight component in SVG
    const svgElem = currentTab === "hrsg" ? document.getElementById("svg-hrsg") : document.getElementById("svg-fgd");
    if (!isStepChange) {
        document.querySelectorAll(".interactive-component").forEach(comp => {
            comp.classList.remove("highlighted");
        });
        const compElem = document.getElementById(compId);
        if (compElem) {
            compElem.classList.add("highlighted");
            currentHighlightedElement = compElem;
            svgElem.classList.add("has-highlight");
        }
    }

    // Update Detail Panel Info
    const overlay = document.getElementById("info-overlay");
    document.getElementById("info-title").innerText = details.title;
    document.getElementById("info-desc").innerText = details.desc;

    const specContainer = document.getElementById("info-specs");
    specContainer.innerHTML = "";

    Object.entries(details.specs).forEach(([label, val]) => {
        const item = document.createElement("div");
        item.className = "spec-item";
        item.innerHTML = `
            <div class="spec-label">${label}</div>
            <div class="spec-value">${val}</div>
        `;
        specContainer.appendChild(item);
    });

    overlay.classList.add("active");
}

function showOverview() {
    // Highlight all flows of the current system
    document.querySelectorAll(".flow-path").forEach(flow => {
        flow.classList.add("active");
    });

    // Remove specific highlighted component
    document.querySelectorAll(".interactive-component").forEach(comp => {
        comp.classList.remove("highlighted");
    });

    // Clear spotlight dimming
    document.getElementById("svg-hrsg").classList.remove("has-highlight");
    document.getElementById("svg-fgd").classList.remove("has-highlight");

    const overlay = document.getElementById("info-overlay");
    const specContainer = document.getElementById("info-specs");

    if (currentTab === "hrsg") {
        document.getElementById("info-title").innerText = "ภาพรวมระบบ Combined Cycle & HRSG";
        document.getElementById("info-desc").innerText = "ระบบโรงไฟฟ้าความร้อนร่วมนำไอเสียร้อนจากกังหันแก๊สมาต้มน้ำเพื่อหมุนกังหันไอน้ำ ช่วยรีดประสิทธิภาพการผลิตไฟฟ้าจากเชื้อเพลิงสูงสุดถึง 60% เมื่อเทียบกับโรงไฟฟ้าทั่วไป";
        
        specContainer.innerHTML = `
            <div class="spec-item" style="grid-column: 1 / -1;">
                <div class="spec-label">ประสิทธิภาพโรงไฟฟ้ารวม (Efficiency)</div>
                <div class="spec-value" style="color: #10b981; font-size: 1rem;">~ 58 - 60% (เทียบเดิม 38%)</div>
            </div>
            <div class="spec-item">
                <div class="spec-label">กำลังผลิต Gas Turbine</div>
                <div class="spec-value">150 MW</div>
            </div>
            <div class="spec-item">
                <div class="spec-label">กำลังผลิต Steam Turbine</div>
                <div class="spec-value">75 MW</div>
            </div>
            <div class="spec-item">
                <div class="spec-label">แรงดันไอน้ำหลัก (Main Steam)</div>
                <div class="spec-value">105 bar</div>
            </div>
            <div class="spec-item">
                <div class="spec-label">อุณหภูมิไอเสียปลาย stack</div>
                <div class="spec-value">105 °C</div>
            </div>
        `;
        
        document.getElementById("current-step-num").innerText = "ภาพรวม";
        document.getElementById("current-step-title").innerText = "Combined Cycle Plant Diagram";
        document.getElementById("current-step-desc").innerText = "ก๊าซร้อน (สีส้ม) เดินทางจากซ้ายไปขวาเพื่อต้มน้ำ (สีน้ำเงิน) ให้เดือดกลายเป็นไอน้ำ (สีชมพู) เข้ากังหันไอน้ำ";
        
        // Update floating HUD overlay on diagram
        document.getElementById("hud-step-num").innerText = "ภาพรวม";
        document.getElementById("hud-step-title").innerText = "Combined Cycle Plant Diagram";
        document.getElementById("hud-step-desc").innerText = "ก๊าซร้อน (สีส้ม) เดินทางจากซ้ายไปขวาเพื่อต้มน้ำ (สีน้ำเงิน) ให้เดือดกลายเป็นไอน้ำ (สีชมพู) เข้ากังหันไอน้ำ";
    } else {
        document.getElementById("info-title").innerText = "ภาพรวมระบบกําจัด SO2 โรงไฟฟ้าแม่เมาะ (Wet FGD)";
        document.getElementById("info-desc").innerText = "ระบบกำจัดก๊าซซัลเฟอร์ไดออกไซด์แบบเปียกโดยใช้น้ำปูนหินปูน (Wet Limestone FGD) ขจัดมลพิษแก๊สที่เป็นกรดได้อย่างมีประสิทธิภาพสูงกว่า 96% และผลิตยิปซัมแห้งเป็นวัสดุพลอยได้";
        
        specContainer.innerHTML = `
            <div class="spec-item" style="grid-column: 1 / -1;">
                <div class="spec-label">ประสิทธิภาพการขจัดก๊าซ SO2 (SO2 Removal)</div>
                <div class="spec-value" style="color: #10b981; font-size: 1rem;">> 96% (ผ่านมาตรฐานสิ่งแวดล้อม)</div>
            </div>
            <div class="spec-item">
                <div class="spec-label">อัตราสารละลายหินปูนที่จ่าย</div>
                <div class="spec-value">35 t/h</div>
            </div>
            <div class="spec-item">
                <div class="spec-label">กำลังผลิตยิปซัมแห้งผลผลิต</div>
                <div class="spec-value">48 t/h</div>
            </div>
            <div class="spec-item">
                <div class="spec-label">ปริมาณก๊าซบำบัด</div>
                <div class="spec-value">950 m³/s</div>
            </div>
            <div class="spec-item">
                <div class="spec-label">อุณหภูมิก๊าซสะอาดปลาย stack</div>
                <div class="spec-value">~ 50 °C (ควันชื้นสีขาว)</div>
            </div>
        `;
        
        document.getElementById("current-step-num").innerText = "ภาพรวม";
        document.getElementById("current-step-title").innerText = "Wet FGD Plant Diagram (Mae Moh)";
        document.getElementById("current-step-desc").innerText = "ก๊าซเสีย (สีเทา) วิ่งผ่าน Booster Fan เข้ามาฉีดสเปรย์พ่นหินปูน (สีเทาอ่อน) เกิดปฏิกิริยากลายเป็นยิปซัมป้อนออกก้นถัง (สีเหลือง)";
        
        // Update floating HUD overlay on diagram
        document.getElementById("hud-step-num").innerText = "ภาพรวม";
        document.getElementById("hud-step-title").innerText = "Wet FGD Plant Diagram (Mae Moh)";
        document.getElementById("hud-step-desc").innerText = "ก๊าซเสีย (สีเทา) วิ่งผ่าน Booster Fan เข้ามาฉีดสเปรย์พ่นหินปูน (สีเทาอ่อน) เกิดปฏิกิริยากลายเป็นยิปซัมป้อนออกก้นถัง (สีเหลือง)";
    }

    // Trigger HUD slide animation
    const hud = document.getElementById("step-hud");
    hud.classList.remove("hud-animate");
    void hud.offsetWidth; // Trigger reflow
    hud.classList.add("hud-animate");

    overlay.classList.add("active");
    
    // Clear sidebar active class
    document.querySelectorAll(".step-card").forEach(card => card.classList.remove("active"));
}

function startAutoplay() {
    isPlaying = true;
    const playBtn = document.getElementById("btn-play");
    playBtn.innerHTML = `
        <svg style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 4px;" viewBox="0 0 24 24" fill="currentColor">
            <rect x="4" y="4" width="6" height="16" rx="1"/>
            <rect x="14" y="4" width="6" height="16" rx="1"/>
        </svg>
        <span>Pause</span>
    `;
    playBtn.classList.add("btn-primary");

    playInterval = setInterval(() => {
        const config = currentTab === "hrsg" ? hrsgConfig : fgdConfig;
        setStep((currentStep + 1) % config.steps.length);
    }, 6000);
}

function pauseAutoplay() {
    isPlaying = false;
    clearInterval(playInterval);
    const playBtn = document.getElementById("btn-play");
    playBtn.innerHTML = `
        <svg style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 4px;" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21"/>
        </svg>
        <span>Auto Play</span>
    `;
    playBtn.classList.remove("btn-primary");
}

// ==========================================
// VIEW NAVIGATION LOGIC
// ==========================================
function switchView(viewName) {
    const homeView = document.getElementById("home-view");
    const powerplantView = document.getElementById("powerplant-view");
    const affiliateView = document.getElementById("affiliate-view");
    const cashflowView = document.getElementById("cashflow-view");
    const egatFundsView = document.getElementById("egat-funds-view");
    const dndAdventureView = document.getElementById("dnd-adventure-view");
    const powerplantTabs = document.getElementById("powerplant-tabs");

    // Pause powerplant autoplay when leaving powerplant view
    if (viewName !== "powerplant" && isPlaying) {
        pauseAutoplay();
    }

    // Hide all views
    homeView.classList.add("hidden");
    powerplantView.classList.add("hidden");
    affiliateView.classList.add("hidden");
    cashflowView.classList.add("hidden");
    if (egatFundsView) egatFundsView.classList.add("hidden");
    if (dndAdventureView) dndAdventureView.classList.add("hidden");

    // Update active nav button
    document.querySelectorAll(".nav-link-btn").forEach(btn => btn.classList.remove("active"));

    // Show selected view
    if (viewName === "home") {
        homeView.classList.remove("hidden");
        document.getElementById("nav-home-btn").classList.add("active");
        powerplantTabs.classList.add("hidden");
    } else if (viewName === "powerplant") {
        powerplantView.classList.remove("hidden");
        document.getElementById("nav-powerplant-btn").classList.add("active");
        powerplantTabs.classList.remove("hidden");
        // Reload system to ensure SVG sizes recalculate nicely
        loadSystem(currentTab);
    } else if (viewName === "affiliate") {
        affiliateView.classList.remove("hidden");
        document.getElementById("nav-affiliate-btn").classList.add("active");
        powerplantTabs.classList.add("hidden");
        // Render Shopee views
        renderSavedLinks();
        renderAffiliateChart("7d");
    } else if (viewName === "cashflow") {
        cashflowView.classList.remove("hidden");
        document.getElementById("nav-cashflow-btn").classList.add("active");
        powerplantTabs.classList.add("hidden");
    } else if (viewName === "egat") {
        if (egatFundsView) egatFundsView.classList.remove("hidden");
        const navBtn = document.getElementById("nav-egat-btn");
        if (navBtn) navBtn.classList.add("active");
        powerplantTabs.classList.add("hidden");
        // Initialize EGAT funds analyzer engine
        initEgatFundsPage();
    } else if (viewName === "dnd") {
        if (dndAdventureView) dndAdventureView.classList.remove("hidden");
        const navBtn = document.getElementById("nav-dnd-btn");
        if (navBtn) navBtn.classList.add("active");
        powerplantTabs.classList.add("hidden");
        // Initialize DND engine
        initDndEngine();
    }
}

function initNavigation() {
    // Mode Cards
    const cardPowerplant = document.getElementById("mode-powerplant");
    cardPowerplant.addEventListener("click", () => switchView("powerplant"));

    const cardAffiliate = document.getElementById("mode-affiliate");
    cardAffiliate.addEventListener("click", () => switchView("affiliate"));

    const cardCashflow = document.getElementById("mode-cashflow");
    cardCashflow.addEventListener("click", () => switchView("cashflow"));

    const cardEgat = document.getElementById("mode-egat");
    if (cardEgat) cardEgat.addEventListener("click", () => switchView("egat"));

    const cardDnd = document.getElementById("mode-dnd");
    if (cardDnd) cardDnd.addEventListener("click", () => switchView("dnd"));

    // Top Navigation Link Buttons
    document.getElementById("nav-home-btn").addEventListener("click", () => switchView("home"));
    document.getElementById("nav-powerplant-btn").addEventListener("click", () => switchView("powerplant"));
    document.getElementById("nav-affiliate-btn").addEventListener("click", () => switchView("affiliate"));
    document.getElementById("nav-cashflow-btn").addEventListener("click", () => switchView("cashflow"));
    
    const navEgat = document.getElementById("nav-egat-btn");
    if (navEgat) navEgat.addEventListener("click", () => switchView("egat"));

    const navDnd = document.getElementById("nav-dnd-btn");
    if (navDnd) navDnd.addEventListener("click", () => switchView("dnd"));

    // Brand Logo Click
    document.getElementById("brand-logo").addEventListener("click", () => switchView("home"));
}

// ==========================================
// SHOPEE AFFILIATE CONTROLLER LOGIC
// ==========================================

// Seed default links if empty
const defaultShopeeLinks = [
    { id: "1", name: "พัดลมตั้งโต๊ะไร้สายแบบชาร์จไฟมินิมอล 🏠", category: "ของแต่งบ้าน", commission: 10, affUrl: "https://shope.ee/5fL1a91" },
    { id: "2", name: "ขาตั้งกล้องเซลฟี่ Bluetooth หมุน 360° 💻", category: "อุปกรณ์แต่งคอม", commission: 8, affUrl: "https://shope.ee/3fK2b82" },
    { id: "3", name: "มาม่าเผ็ดเกาหลี Samyang รสไก่เผ็ดร้อน 🍜", category: "ของกินอร่อย", commission: 5, affUrl: "https://shope.ee/9fO3d93" }
];

function getSavedLinks() {
    const data = localStorage.getItem("shopee_aff_links");
    if (!data) {
        localStorage.setItem("shopee_aff_links", JSON.stringify(defaultShopeeLinks));
        return defaultShopeeLinks;
    }
    return JSON.parse(data);
}

function saveLinks(links) {
    localStorage.setItem("shopee_aff_links", JSON.stringify(links));
}

// Render product list table
function renderSavedLinks() {
    const links = getSavedLinks();
    const tbody = document.getElementById("saved-links-list");
    const searchQuery = document.getElementById("search-saved-links").value.toLowerCase();
    const filterCategory = document.getElementById("filter-saved-category").value;

    tbody.innerHTML = "";

    const filtered = links.filter(link => {
        const matchSearch = link.name.toLowerCase().includes(searchQuery) || link.affUrl.toLowerCase().includes(searchQuery);
        const matchCategory = filterCategory === "all" || link.category === filterCategory;
        return matchSearch && matchCategory;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 2rem;">ไม่มีข้อมูลในหมวดหมู่นี้ หรือไม่พบผลลัพธ์การค้นหา</td></tr>`;
        return;
    }

    filtered.forEach(link => {
        const tr = document.createElement("tr");
        
        let categoryClass = "badge-home";
        if (link.category === "อุปกรณ์แต่งคอม") categoryClass = "badge-computer";
        else if (link.category === "ของกินอร่อย") categoryClass = "badge-food";
        else if (link.category === "อื่น ๆ") categoryClass = "badge-other";

        tr.innerHTML = `
            <td data-label="ชื่อสินค้า" style="font-weight: 600;">${link.name}</td>
            <td data-label="หมวดหมู่"><span class="category-badge ${categoryClass}">${link.category}</span></td>
            <td data-label="ค่าคอม" style="text-align: center; font-weight: 700; color: #ee4d2d;">${link.commission}%</td>
            <td data-label="ลิงก์แนะนำ">
                <div class="copy-input-group" style="max-width: 260px;">
                    <input type="text" value="${link.affUrl}" readonly style="font-size: 0.75rem; padding: 0.3rem 0.5rem; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); color: #10b981; border-radius: 4px; width: 100%;">
                    <button class="btn-action-copy" data-link="${link.affUrl}">คัดลอก</button>
                </div>
            </td>
            <td data-label="การจัดการ" style="text-align: center;">
                <button class="btn-delete" data-id="${link.id}">&times;</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Bind event listeners to table buttons
    tbody.querySelectorAll(".btn-action-copy").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const url = e.target.getAttribute("data-link");
            navigator.clipboard.writeText(url).then(() => {
                const oldText = e.target.innerText;
                e.target.innerText = "แล้ว!";
                e.target.style.background = "#10b981";
                e.target.style.color = "#fff";
                setTimeout(() => {
                    e.target.innerText = oldText;
                    e.target.style.background = "";
                    e.target.style.color = "";
                }, 1500);
            });
        });
    });

    tbody.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.target.getAttribute("data-id");
            if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบสินค้าแนะนำชิ้นนี้?")) {
                const links = getSavedLinks();
                const updated = links.filter(l => l.id !== id);
                saveLinks(updated);
                renderSavedLinks();
            }
        });
    });
}

// Convert normal Shopee link to Affiliate link
function initAffiliateConverter() {
    const btnConvert = document.getElementById("btn-convert-link");
    btnConvert.addEventListener("click", () => {
        const inputUrl = document.getElementById("input-shopee-url").value.trim();
        const subid = document.getElementById("input-subid").value.trim();

        if (!inputUrl) {
            alert("กรุณากรอกลิงก์ Shopee ก่อนกดแปลงลิงก์ครับ");
            return;
        }

        // Simulating Shopee Universal Link formatting
        let targetId = "3fK2b82";
        if (inputUrl.includes("shopee.co.th")) {
            // Generate a random-looking short affiliate code
            const hash = Math.random().toString(36).substring(2, 9);
            targetId = hash;
        }
        
        let affUrl = `https://shope.ee/${targetId}`;
        if (subid) {
            affUrl += `?subid=${encodeURIComponent(subid)}`;
        }

        // Show result
        const resultArea = document.getElementById("convert-result-area");
        resultArea.classList.remove("hidden");
        document.getElementById("output-affiliate-url").value = affUrl;

        // Load QR Code using standard QR code API
        const qrImg = document.getElementById("output-qr-image");
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(affUrl)}`;

        // Scroll result into view smoothly
        resultArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    // Result Copy Button
    document.getElementById("btn-copy-aff").addEventListener("click", () => {
        const outputField = document.getElementById("output-affiliate-url");
        navigator.clipboard.writeText(outputField.value).then(() => {
            const copyBtn = document.getElementById("btn-copy-aff");
            copyBtn.innerText = "คัดลอกเรียบร้อย! ✓";
            copyBtn.style.background = "#059669";
            setTimeout(() => {
                copyBtn.innerText = "คัดลอกลิงก์";
                copyBtn.style.background = "";
            }, 2000);
        });
    });

    // Add custom product to library form
    const btnAdd = document.getElementById("btn-add-product");
    btnAdd.addEventListener("click", () => {
        const name = document.getElementById("prod-name").value.trim();
        const category = document.getElementById("prod-category").value;
        const commission = parseInt(document.getElementById("prod-commission").value) || 8;
        const affUrl = document.getElementById("prod-aff-url").value.trim();

        if (!name || !affUrl) {
            alert("กรุณากรอกชื่อสินค้าและลิงก์แนะนำนายหน้ารายละเอียดให้ครบถ้วนครับ");
            return;
        }

        const newLink = {
            id: Date.now().toString(),
            name,
            category,
            commission,
            affUrl
        };

        const links = getSavedLinks();
        links.unshift(newLink);
        saveLinks(links);

        // Reset form
        document.getElementById("prod-name").value = "";
        document.getElementById("prod-aff-url").value = "";

        // Re-render
        renderSavedLinks();
        alert("เพิ่มสินค้าลงในคลังเรียบร้อยแล้ว!");
    });

    // Live search & filters
    document.getElementById("search-saved-links").addEventListener("input", renderSavedLinks);
    document.getElementById("filter-saved-category").addEventListener("change", renderSavedLinks);
}

// Render dynamic column chart using SVG
function renderAffiliateChart(timeframe) {
    const chartSvg = document.getElementById("aff-chart");
    chartSvg.innerHTML = "";

    const data7d = [
        { label: "จ.", value: 120, commission: 96 },
        { label: "อ.", value: 180, commission: 144 },
        { label: "พ.", value: 340, commission: 272 },
        { label: "พฤ.", value: 150, commission: 120 },
        { label: "ศ.", value: 290, commission: 232 },
        { label: "ส.", value: 450, commission: 360 },
        { label: "อา.", value: 390, commission: 312 }
    ];

    const data30d = [
        { label: "1-5", value: 840, commission: 672 },
        { label: "6-10", value: 1100, commission: 880 },
        { label: "11-15", value: 1650, commission: 1320 },
        { label: "16-20", value: 920, commission: 736 },
        { label: "21-25", value: 1980, commission: 1584 },
        { label: "26-30", value: 2450, commission: 1960 }
    ];

    const activeData = timeframe === "7d" ? data7d : data30d;

    // Update Stats Summary text based on timeframe
    if (timeframe === "7d") {
        document.getElementById("stat-gmv").innerText = "฿24,500";
        document.getElementById("stat-commission").innerText = "฿1,960";
        document.getElementById("stat-clicks").innerText = "1,920";
        document.getElementById("stat-cr").innerText = "2.8%";
    } else {
        document.getElementById("stat-gmv").innerText = "฿112,400";
        document.getElementById("stat-commission").innerText = "฿7,232";
        document.getElementById("stat-clicks").innerText = "8,940";
        document.getElementById("stat-cr").innerText = "3.4%";
    }

    // Chart layouts
    const width = 600;
    const height = 200;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Find max value for scale
    const maxValue = Math.max(...activeData.map(d => d.commission));
    const scaleY = val => (val / maxValue) * (chartHeight * 0.85);

    // Draw grid horizontal lines
    for (let i = 0; i <= 4; i++) {
        const y = paddingTop + chartHeight - (chartHeight / 4) * i;
        const valueLabel = Math.round((maxValue / 4) * i);
        
        // Line
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", paddingLeft);
        line.setAttribute("y1", y);
        line.setAttribute("x2", width - paddingRight);
        line.setAttribute("y2", y);
        line.setAttribute("stroke", "rgba(255, 255, 255, 0.05)");
        line.setAttribute("stroke-width", "1");
        chartSvg.appendChild(line);

        // Value text
        const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
        txt.setAttribute("x", paddingLeft - 8);
        txt.setAttribute("y", y + 4);
        txt.setAttribute("fill", "var(--text-secondary)");
        txt.setAttribute("font-size", "9px");
        txt.setAttribute("text-anchor", "end");
        txt.textContent = `฿${valueLabel}`;
        chartSvg.appendChild(txt);
    }

    // Draw columns
    const colCount = activeData.length;
    const colSpacing = chartWidth / colCount;
    const barWidth = Math.min(colSpacing * 0.5, 40);

    activeData.forEach((d, idx) => {
        const x = paddingLeft + colSpacing * idx + (colSpacing - barWidth) / 2;
        const barHeight = scaleY(d.commission);
        const y = paddingTop + chartHeight - barHeight;

        // Create column bar group
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

        // The Bar rect
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", barWidth);
        rect.setAttribute("height", barHeight);
        rect.setAttribute("class", "chart-bar");
        rect.setAttribute("fill", timeframe === "7d" ? "url(#pipe-gas)" : "url(#pipe-water)");
        rect.setAttribute("rx", "4");
        g.appendChild(rect);

        // Tooltip hover label value on top of bar
        const txtVal = document.createElementNS("http://www.w3.org/2000/svg", "text");
        txtVal.setAttribute("x", x + barWidth / 2);
        txtVal.setAttribute("y", y - 6);
        txtVal.setAttribute("fill", "var(--text-primary)");
        txtVal.setAttribute("font-size", "9px");
        txtVal.setAttribute("font-weight", "700");
        txtVal.setAttribute("text-anchor", "middle");
        txtVal.textContent = `฿${d.commission}`;
        g.appendChild(txtVal);

        // X Axis labels
        const txtLbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
        txtLbl.setAttribute("x", x + barWidth / 2);
        txtLbl.setAttribute("y", paddingTop + chartHeight + 18);
        txtLbl.setAttribute("fill", "var(--text-secondary)");
        txtLbl.setAttribute("font-size", "10px");
        txtLbl.setAttribute("font-weight", "600");
        txtLbl.setAttribute("text-anchor", "middle");
        txtLbl.textContent = d.label;
        g.appendChild(txtLbl);

        chartSvg.appendChild(g);
    });
}

function initAffiliateAnalytics() {
    const btn7d = document.getElementById("btn-toggle-7d");
    const btn30d = document.getElementById("btn-toggle-30d");

    btn7d.addEventListener("click", () => {
        btn7d.classList.add("active");
        btn30d.classList.remove("active");
        renderAffiliateChart("7d");
    });

    btn30d.addEventListener("click", () => {
        btn30d.classList.add("active");
        btn7d.classList.remove("active");
        renderAffiliateChart("30d");
    });
}

// ==========================================================================
// ========================== CASHFLOW GAME ENGINE ==========================

const cfCareers = [
    {
        name: "ภารโรง (Janitor)",
        salary: 16000,
        cash: 5600,
        expenses: { taxes: 2800, mortgage: 2000, carLoan: 600, creditCard: 600, retailDebt: 500, other: 3000, bankInterest: 0, childCost: 950 },
        liabilities: { mortgage: 200000, carLoan: 40000, creditCard: 20000, retail: 10000, bankLoan: 0 }
    },
    {
        name: "ครูประถม (School Teacher)",
        salary: 33000,
        cash: 4000,
        expenses: { taxes: 6300, mortgage: 5000, carLoan: 1200, creditCard: 900, retailDebt: 500, other: 7600, bankInterest: 0, childCost: 1800 },
        liabilities: { mortgage: 500000, carLoan: 70000, creditCard: 30000, retail: 10000, bankLoan: 0 }
    },
    {
        name: "วิศวกร (Engineer)",
        salary: 49000,
        cash: 4000,
        expenses: { taxes: 10500, mortgage: 7000, carLoan: 1400, creditCard: 1200, retailDebt: 900, other: 10900, bankInterest: 0, childCost: 2500 },
        liabilities: { mortgage: 750000, carLoan: 90000, creditCard: 40000, retail: 20000, bankLoan: 0 }
    },
    {
        name: "แพทย์ประจำบ้าน (Doctor)",
        salary: 95000,
        cash: 4000,
        expenses: { taxes: 24600, mortgage: 19000, carLoan: 3800, creditCard: 2700, retailDebt: 1800, other: 19000, bankInterest: 0, childCost: 4800 },
        liabilities: { mortgage: 2000000, carLoan: 340000, creditCard: 90000, retail: 50000, bankLoan: 0 }
    }
];

const cfBoardSpaces = [
    { type: "payday", label: "วันจ่ายเงิน 💵" },
    { type: "opportunity", label: "โอกาสการลงทุน 📈" },
    { type: "doodad", label: "ค่าใช้จ่ายฟุ่มเฟือย 🛍️" },
    { type: "opportunity", label: "โอกาสการลงทุน 📈" },
    { type: "payday", label: "วันจ่ายเงิน 💵" },
    { type: "market", label: "ตลาดซื้อขาย 🏢" },
    { type: "opportunity", label: "โอกาสการลงทุน 📈" },
    { type: "doodad", label: "ค่าใช้จ่ายฟุ่มเฟือย 🛍️" },
    { type: "payday", label: "วันจ่ายเงิน 💵" },
    { type: "opportunity", label: "โอกาสการลงทุน 📈" },
    { type: "baby", label: "มีลูกเพิ่ม 👶" },
    { type: "opportunity", label: "โอกาสการลงทุน 📈" },
    { type: "payday", label: "วันจ่ายเงิน 💵" },
    { type: "downsized", label: "ตกงาน 🛑" },
    { type: "doodad", label: "ค่าใช้จ่ายฟุ่มเฟือย 🛍️" },
    { type: "opportunity", label: "โอกาสการลงทุน 📈" },
    { type: "payday", label: "วันจ่ายเงิน 💵" },
    { type: "market", label: "ตลาดซื้อขาย 🏢" },
    { type: "opportunity", label: "โอกาสการลงทุน 📈" },
    { type: "doodad", label: "ค่าใช้จ่ายฟุ่มเฟือย 🛍️" },
    { type: "payday", label: "วันจ่ายเงิน 💵" },
    { type: "opportunity", label: "โอกาสการลงทุน 📈" },
    { type: "market", label: "ตลาดซื้อขาย 🏢" },
    { type: "doodad", label: "ค่าใช้จ่ายฟุ่มเฟือย 🛍️" }
];

// Game State variables
let cfState = {
    profession: null,
    cash: 0,
    salary: 0,
    passiveIncome: 0,
    totalIncome: 0,
    expenses: {},
    liabilities: {},
    assets: {
        stocks: [],      // { symbol, shares, averageCost, dividendPerShare }
        realEstate: [],  // { id, type, cost, downPayment, mortgage, cashFlow }
        businesses: []   // { id, name, cost, downPayment, cashFlow }
    },
    childrenCount: 0,
    boardPosition: 0,
    turnCount: 0,
    downsizedTurnsLeft: 0,
    activeGame: false
};

// Opportunities Deals list
const smallDeals = [
    { type: "stock", symbol: "PTT", name: "หุ้นพลังงาน PTT", cost: 300, range: "฿180 - ฿450", cashFlow: 0, desc: "หุ้นกลุ่มพลังงานปิโตรเลียมยักษ์ใหญ่ของไทย ราคาปัจจุบันน่าดึงดูดใจ คาดหวังการฟื้นตัวของเศรษฐกิจและปันผลในอนาคต" },
    { type: "stock", symbol: "SIRI", name: "หุ้นอสังหาฯ SIRI ปันผล", cost: 150, range: "฿80 - ฿250", cashFlow: 20, desc: "หุ้นพัฒนาอสังหาริมทรัพย์ที่จ่ายเงินปันผลมั่นคงและต่อเนื่องที่ ฿20 ต่อหุ้น/เดือน เหมาะสำหรับสะสมกระแสเงินสด" },
    { type: "stock", symbol: "BTC", name: "เหรียญดิจิทัล BitCoin (BTC)", cost: 1000, range: "฿300 - ฿3,500", cashFlow: 0, desc: "สินทรัพย์ดิจิทัลคริปโทเคอร์เรนซีที่มีความผันผวนสูงมาก เหมาะสำหรับการซื้อสะสมเพื่อขายเก็งกำไรในตลาดกระทิง" },
    { type: "realestate", category: "condo", name: "คอนโดห้องสตูดิโอปล่อยเช่า (Studio Condo)", cost: 400000, downPayment: 40000, mortgage: 360000, cashFlow: 2000, desc: "คอนโดสร้างใหม่ทำเลดีใกล้รถไฟฟ้าสายสีม่วง มีคนเช่าพร้อมทำสัญญาเช่า ปล่อยเช่าสร้างกระแสเงินสด Passive +฿2,000/เดือน" },
    { type: "realestate", category: "house", name: "บ้านทาวน์เฮ้าส์ 2 ชั้นปรับปรุงใหม่ (Townhouse)", cost: 600000, downPayment: 60000, mortgage: 540000, cashFlow: 3000, desc: "ทาวน์เฮ้าส์ในแหล่งชุมชนคนทำงาน เจ้าของเก่าร้อนเงินปล่อยขายต่ำกว่าทุน ปล่อยเช่ารับกระแสเงินสดเน้นๆ +฿3,000/เดือน" }
];

const bigDeals = [
    { type: "realestate", category: "apartment", name: "อพาร์ตเมนต์ 10 ห้อง (10-Unit Apartment)", cost: 2000000, downPayment: 300000, mortgage: 1700000, cashFlow: 16000, desc: "หอพักนักศึกษาใกล้แหล่งสถานศึกษาและนิคมอุตสาหกรรม อัตราเช่าเฉลี่ย 95% ตลอดปี ปล่อยกระแสเงินสดสม่ำเสมอดีเยี่ยม" },
    { type: "realestate", category: "commercial", name: "อาคารพาณิชย์เช่าโดยร้านสะดวกซื้อ (7-11 Tenant)", cost: 3500000, downPayment: 500000, mortgage: 3000000, cashFlow: 32000, desc: "ตึกแถวทำเลสี่แยกใหญ่ แฟรนไชส์ร้านสะดวกซื้อเช่าระยะยาว 10 ปี ได้รับการการันตีค่าเช่าตรงกำหนดทุกสิ้นเดือน" },
    { type: "business", name: "แฟรนไชส์ชาไข่มุกระบบอัตโนมัติ (Bubble Tea)", cost: 1000000, downPayment: 150000, mortgage: 850000, cashFlow: 10000, desc: "ร้านชาไข่มุกระบบปิดกึ่งอัตโนมัติในห้างสรรพสินค้าชั้นนำ ไม่ต้องเฝ้าร้านเอง มีผู้จัดการดูแลพร้อมโอนปันผลให้คุณทุกเดือน" },
    { type: "business", name: "สถานีบริการน้ำมันชุมชนขนาดเล็ก (Gas Station)", cost: 2500000, downPayment: 400000, mortgage: 2100000, cashFlow: 26000, desc: "ปั๊มน้ำมันท้องถิ่นบนทางหลวงหลักหมู่บ้าน มีรายรับเสริมจากค่าเช่าแผงขายผลไม้และร้านค้าในปั๊มเป็นกระแสเงินสด" }
];

// Doodads list
const doodadCards = [
    { name: "ซื้อโทรศัพท์มือถือเรือธงรุ่นใหม่ล่าสุด 📱", cost: 10000, desc: "มือถือเครื่องเก่าตกหน้าจอร้าวพอดี ทนกระแสโฆษณาในโซเชียลไม่ไหว รูดซื้อทันที ฿10,000" },
    { name: "ซ่อมแซมและเช็คระยะรถยนต์กะทันหัน 🚗", cost: 6000, desc: "เครื่องยนต์ส่งเสียงเตือนและระบบไฟหน้าขัดข้อง ต้องเข้าศูนย์บริการเพื่อแก้ไขความปลอดภัย จ่ายเงินสด ฿6,000" },
    { name: "ล่องเรือสำราญสุดหรูในฝั่งอันดามัน 🚢", cost: 15000, desc: "ร่วมทริปประจำปีกับกลุ่มสมาคมเพื่อนเก่าระดับวีไอพี ได้พักผ่อนและทำคอนเทนต์ลงอินสตาแกรม เสียเงินสด ฿15,000" },
    { name: "ซื้อกระเป๋าและเครื่องประดับแบรนด์เนม 🛍️", cost: 3000, desc: "เดินห้างช่วงเทศกาลลดราคากลางปี รูดบัตรซื้อของใช้แฟชั่นส่วนตัวเก็บไว้เป็นรางวัลชีวิต ฿3,000" },
    { name: "จัดงานเลี้ยงวันเกิดส่วนตัว 🎂", cost: 4000, desc: "จัดงานบุฟเฟต์เลี้ยงอาหารและของหวานให้เพื่อนๆ และคนสนิทที่ร้านอาหารริมน้ำ จ่ายค่าอาหาร ฿4,000" }
];

// Market Events list
const marketCards = [
    { type: "buyer_condo", name: "กองทุนอสังหาฯ เสนอซื้อคอนโดสตูดิโอ 🏢", price: 650000, desc: "ความต้องการซื้อคอนโดใกล้รถไฟฟ้าพุ่งสูงขึ้นเนื่องจากทัวร์ท่องเที่ยวจีนกลับมา กองทุนเสนอรับซื้อคอนโดสตูดิโอทุกแห่งในราคา ฿650,000 ขายทำกำไรด่วน!" },
    { type: "buyer_house", name: "ผู้เช่าตกลงซื้อบ้านทาวน์เฮ้าส์ต่อ 🏠", price: 950000, desc: "ผู้เช่าทาวน์เฮ้าส์ของคุณยื่นเรื่องกู้ผ่าน ขอเสนอซื้อบ้านต่อจากคุณในราคาหลังละ ฿950,000 สามารถขายเพื่อรับเงินก้อนสุทธิ (ราคาขายลบยอดจำนอง) ทันที" },
    { type: "stock_boom", symbol: "PTT", price: 440, name: "ราคาหุ้น PTT พุ่งรับวิกฤตพลังงานโลก! 📈", desc: "ราคาน้ำมันดิบพุ่งสูงขึ้นอย่างรวดเร็ว ดึงราคาหุ้น PTT ดีดตัวขึ้นมาที่ ฿440 ต่อหุ้น สามารถขายหุ้น PTT ในมือทั้งหมดเพื่อเอาเงินก้อน" },
    { type: "stock_boom", symbol: "SIRI", price: 230, name: "หุ้น SIRI วิ่งทะยานขานรับดอกเบี้ยขาลง 🚀", desc: "การปรับลดดอกเบี้ยนโยบายเอื้อประโยชน์ต่ออสังหาฯ ราคาหุ้น SIRI พุ่งมาแตะ ฿230 ต่อหุ้น ขายเอากลไรส่วนต่างได้ทันที" },
    { type: "stock_boom", symbol: "BTC", price: 3200, name: "คริปโทฯ กระทิงดุ! Bitcoin พุ่งทะลุแนวต้าน 🚀", desc: "เกิดกระแส Halving ราคาบิตคอยน์วิ่งกระฉูดขึ้นมาที่ ฿3,200 ต่อหน่วย ใครที่มี BTC อยู่ สามารถขายเหรียญออกทั้งหมดเพื่อทำเงินสดมหาศาล" },
    { type: "buyer_apartment", name: "นายทุนต่างชาติยื่นข้อเสนอขอซื้ออพาร์ตเมนต์ 🏢", price: 2800000, desc: "นายทุนยื่นข้อเสนอซื้อตึกอพาร์ตเมนต์ 10 ห้องเพื่อไปทำโรงแรมขนาดเล็ก เสนอซื้อราคา ฿2,800,000 หักยอดจำนองที่เหลือและรับเงินส่วนต่างสดๆ ได้ทันที" },
    { type: "inflation", name: "วิกฤตเศรษฐกิจจากปัญหาเงินเฟ้อทั่วประเทศ 💸", price: 3000, desc: "ราคาสินค้าอุปโภคบริโภค น้ำมัน และแก๊สหุงต้มปรับตัวสูงขึ้นพร้อมกัน จ่ายเงินสดค่าใช้จ่ายปรับราคาสินค้าเพิ่มขึ้น ฿3,000" }
];

// Initialize and setup Event listeners
function initCashflowGame() {
    renderCareers();

    // Board click and action buttons
    document.getElementById("btn-roll-dice").addEventListener("click", rollDice);
    document.getElementById("btn-bank-borrow").addEventListener("click", borrowBank);
    document.getElementById("btn-bank-repay").addEventListener("click", repayBank);

    // Debt repayments
    document.getElementById("btn-pay-credit-card").addEventListener("click", () => repayDebt("creditCard"));
    document.getElementById("btn-pay-car-loan").addEventListener("click", () => repayDebt("carLoan"));

    // Reset game button
    document.getElementById("btn-restart-game").addEventListener("click", () => {
        document.getElementById("cf-victory-modal").classList.add("hidden");
        cfState.activeGame = false;
        renderCareers();
        document.getElementById("cf-career-select").classList.remove("hidden");
        document.getElementById("cf-game-board-view").classList.add("hidden");
    });
}

// Render Career selection screen
function renderCareers() {
    const container = document.getElementById("career-options-container");
    container.innerHTML = "";

    cfCareers.forEach((car, idx) => {
        const card = document.createElement("div");
        card.className = "career-card";
        
        // Sum initial expenses
        let totalExp = 0;
        Object.values(car.expenses).forEach(v => { totalExp += v; });
        // Exclude childCost since childrenCount starts at 0
        totalExp -= car.expenses.childCost; 
        const netFlow = car.salary - totalExp;

        card.innerHTML = `
            <h4>
                <span>${car.name}</span>
                <span style="color: #10b981;">+฿${netFlow.toLocaleString()}</span>
            </h4>
            <div class="career-card-body">
                <div class="career-stat"><span>รายรับเงินเดือน (Salary):</span> <strong>฿${car.salary.toLocaleString()}</strong></div>
                <div class="career-stat"><span>รายจ่ายเริ่มต้น:</span> <strong class="text-red">฿${totalExp.toLocaleString()}</strong></div>
                <div class="career-stat"><span>เงินออมเริ่มต้น:</span> <strong class="text-green">฿${car.cash.toLocaleString()}</strong></div>
                <div class="career-stat"><span>หนี้สินบ้าน (Mortgage):</span> <strong>฿${car.liabilities.mortgage.toLocaleString()}</strong></div>
                <div class="career-stat"><span>หนี้บัตรเครดิตสะสม:</span> <strong>฿${car.liabilities.creditCard.toLocaleString()}</strong></div>
                <div class="career-stat"><span>ค่าเลี้ยงดูลูก (ต่อคน):</span> <strong class="text-red">฿${car.expenses.childCost.toLocaleString()}</strong></div>
            </div>
            <button class="mode-btn btn-green" onclick="startCashflowGame(${idx})">เลือกอาชีพนี้ ➡️</button>
        `;
        container.appendChild(card);
    });
}

// Launch game with selected career
function startCashflowGame(careerIdx) {
    const car = cfCareers[careerIdx];
    
    // Reset state
    cfState.profession = car.name;
    cfState.cash = car.cash;
    cfState.salary = car.salary;
    cfState.passiveIncome = 0;
    cfState.expenses = { ...car.expenses };
    cfState.liabilities = { ...car.liabilities };
    cfState.assets = { stocks: [], realEstate: [], businesses: [] };
    cfState.childrenCount = 0;
    cfState.boardPosition = 0;
    cfState.turnCount = 0;
    cfState.downsizedTurnsLeft = 0;
    cfState.activeGame = true;

    // Build the visual board track in DOM
    buildBoardTrack();

    // Hide Career select and show Board
    document.getElementById("cf-career-select").classList.add("hidden");
    document.getElementById("cf-game-board-view").classList.remove("hidden");

    // Clean log panel
    const logBox = document.getElementById("cf-game-logs");
    logBox.innerHTML = `<div class="log-entry system-log">เริ่มต้นเกม: คุณทำงานเป็น ${car.name} เริ่มต้นลู่แข่ง Rat Race เงินสดในมือ ฿${cfState.cash.toLocaleString()}</div>`;

    // Render original card state
    document.getElementById("event-card-display").innerHTML = `
        <div class="event-card empty-state">
            <h4>เตรียมตัวทอยลูกเต๋าเพื่อเดินทาง 🎲</h4>
            <p>กดปุ่ม "ทอยลูกเต๋า" เพื่อเคลื่อนตำแหน่งหมากของคุณ ตกช่องใดจะเกิดเหตุการณ์ทางการเงินของช่องนั้น ๆ</p>
        </div>
    `;

    updateCFUI();
}

// Build 24 rectangular track slots dynamically
function buildBoardTrack() {
    const track = document.getElementById("cf-board-track");
    track.innerHTML = "";

    // Coordinates mapping for 8x6 grid
    const coordinates = [
        { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 1, c: 4 }, { r: 1, c: 5 }, { r: 1, c: 6 }, { r: 1, c: 7 }, { r: 1, c: 8 },
        { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 }, { r: 6, c: 8 },
        { r: 6, c: 7 }, { r: 6, c: 6 }, { r: 6, c: 5 }, { r: 6, c: 4 }, { r: 6, c: 3 }, { r: 6, c: 2 }, { r: 6, c: 1 },
        { r: 5, c: 1 }, { r: 4, c: 1 }, { r: 3, c: 1 }, { r: 2, c: 1 }
    ];

    cfBoardSpaces.forEach((space, idx) => {
        const slot = document.createElement("div");
        slot.className = `track-slot slot-${space.type}`;
        slot.id = `cf-slot-${idx}`;
        slot.style.gridRow = coordinates[idx].r;
        slot.style.gridColumn = coordinates[idx].c;

        const labelStr = space.label;
        const emoji = labelStr.substring(labelStr.length - 2);
        const text = labelStr.substring(0, labelStr.length - 2).trim();

        slot.innerHTML = `
            <span class="slot-num">${idx + 1}</span>
            <div class="slot-label">
                <span class="slot-text">${text}</span>
                <span class="slot-emoji">${emoji}</span>
            </div>
        `;
        track.appendChild(slot);
    });

    // Mark current player position
    document.getElementById(`cf-slot-0`).classList.add("active-token");
}

// Roll dice & move player
function rollDice() {
    if (!cfState.activeGame) return;

    // Check if player is downsized
    if (cfState.downsizedTurnsLeft > 0) {
        cfState.downsizedTurnsLeft--;
        cfState.turnCount++;
        addCFLog(`คุณยังถูกตกงานอยู่! พลาดตานี้ (เหลือเวลาหยุดเดิน ${cfState.downsizedTurnsLeft} ตา)`, "doodad-log");
        document.getElementById("game-turn-count").innerText = cfState.turnCount;
        if (cfState.downsizedTurnsLeft === 0) {
            addCFLog("หางานใหม่เสร็จสิ้น! คุณเริ่มเดินได้ตามปกติในรอบหน้า", "system-log");
        }
        return;
    }

    const roll = Math.floor(Math.random() * 6) + 1;
    const oldPosition = cfState.boardPosition;
    cfState.boardPosition = (cfState.boardPosition + roll) % 24;
    cfState.turnCount++;

    // Visual animation to show rolled value
    const diceResult = document.getElementById("dice-result");
    const diceEmoji = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    diceResult.innerText = diceEmoji[roll - 1];

    // Remove token from old slot, add to new slot
    document.querySelectorAll(".track-slot").forEach(s => s.classList.remove("active-token"));
    document.getElementById(`cf-slot-${cfState.boardPosition}`).classList.add("active-token");

    addCFLog(`ทอยลูกเต๋าได้ ${roll} แต้ม 🎲 เดินทางไปยังช่อง ${cfState.boardPosition + 1}`, "system-log");

    // Rat Race Rule: Whenever you land on OR PASS a Payday slot, you get paid!
    let paydayCrossedCount = 0;
    for (let step = 1; step <= roll; step++) {
        const checkPos = (oldPosition + step) % 24;
        if (cfBoardSpaces[checkPos].type === "payday") {
            paydayCrossedCount++;
        }
    }

    if (paydayCrossedCount > 0) {
        const netFlow = calculateCFNetFlow();
        cfState.cash += netFlow * paydayCrossedCount;
        addCFLog(`💵 ได้รับเงินวันจ่ายเงิน (Payday)! รับรายได้สุทธิ ฿${netFlow.toLocaleString()} x ${paydayCrossedCount} = ฿${(netFlow * paydayCrossedCount).toLocaleString()}`, "payday-log");
    }

    // Process landing space type
    const space = cfBoardSpaces[cfState.boardPosition];
    handleSpaceEvent(space.type);

    updateCFUI();
}

// Handle space landing event
function handleSpaceEvent(type) {
    const container = document.getElementById("event-card-display");

    switch (type) {
        case "payday":
            container.innerHTML = `
                <div class="event-card">
                    <h4>💵 วันรับเงินเดือนกะทันหัน (Payday)</h4>
                    <p>คุณเดินตกช่องวันรับเงินเดือนโดยตรง! ได้รับกระแสเงินสดตามงบสุทธิเป็นที่เรียบร้อย สะสมสินทรัพย์และหลีกเลี่ยงรายจ่ายฟุ่มเฟือยเพื่อสร้างความมั่งคั่งต่อไป</p>
                    <button class="btn btn-green-full" onclick="clearEventCard()">รับทราบ ➡️</button>
                </div>
            `;
            break;

        case "opportunity":
            container.innerHTML = `
                <div class="event-card">
                    <h4>📈 โอกาสการลงทุนเพื่อสร้าง Passive Income</h4>
                    <p>คุณสามารถเลือกซื้อ "ดีลเล็ก" (Small Deal - วงเงินดาวน์ไม่เกิน ฿50,000 เหมาะสำหรับเก็บหอมรอบริบหุ้นหรืออสังหาขนาดเล็ก) หรือ "ดีลใหญ่" (Big Deal - ต้องการเงินลงทุนสูง แต่ให้ Passive Income ก้อนใหญ่)</p>
                    <div class="event-card-actions">
                        <button class="btn btn-card-buy" onclick="drawDeal('small')">ดีลขนาดเล็ก 📈</button>
                        <button class="btn btn-card-pass" onclick="drawDeal('big')">ดีลขนาดใหญ่ 🏢</button>
                    </div>
                </div>
            `;
            break;

        case "doodad":
            const card = doodadCards[Math.floor(Math.random() * doodadCards.length)];
            cfState.cash -= card.cost;
            addCFLog(`🛍️ ค่าใช้จ่ายฟุ่มเฟือย: ${card.name} เสียเงินสด ฿${card.cost.toLocaleString()}`, "doodad-log");

            container.innerHTML = `
                <div class="event-card" style="border-left: 4px solid #ef4444;">
                    <h4 class="text-red">🛍️ รายจ่ายฟุ่มเฟือย (Doodad Drawn)</h4>
                    <p class="event-card-subtitle">${card.name}</p>
                    <p>${card.desc} เงินสดถูกหักจากมือจำนวน <strong>฿${card.cost.toLocaleString()}</strong> ทันที</p>
                    <button class="btn btn-green-full" onclick="clearEventCard()">ชำระเงินเรียบร้อย ➡️</button>
                </div>
            `;
            break;

        case "market":
            const market = marketCards[Math.floor(Math.random() * marketCards.length)];
            let sellAvailable = false;
            let sellDetailsHTML = "";

            if (market.type === "buyer_condo") {
                const condos = cfState.assets.realEstate.filter(re => re.category === "condo");
                if (condos.length > 0) {
                    sellAvailable = true;
                    sellDetailsHTML = condos.map(c => `
                        <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem;">
                            <span>${c.name} (ค่าเช่า +฿${c.cashFlow.toLocaleString()})</span>
                            <button class="btn-action-borrow" onclick="sellRealEstate('${c.id}', ${market.price})">ขายรับเงินก้อน (+฿${(market.price - c.mortgage).toLocaleString()})</button>
                        </div>
                    `).join("");
                }
            } else if (market.type === "buyer_house") {
                const houses = cfState.assets.realEstate.filter(re => re.category === "house");
                if (houses.length > 0) {
                    sellAvailable = true;
                    sellDetailsHTML = houses.map(h => `
                        <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem;">
                            <span>${h.name} (ค่าเช่า +฿${h.cashFlow.toLocaleString()})</span>
                            <button class="btn-action-borrow" onclick="sellRealEstate('${h.id}', ${market.price})">ขายรับเงินก้อน (+฿${(market.price - h.mortgage).toLocaleString()})</button>
                        </div>
                    `).join("");
                }
            } else if (market.type === "buyer_apartment") {
                const apartments = cfState.assets.realEstate.filter(re => re.category === "apartment");
                if (apartments.length > 0) {
                    sellAvailable = true;
                    sellDetailsHTML = apartments.map(a => `
                        <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem;">
                            <span>${a.name} (ค่าเช่า +฿${a.cashFlow.toLocaleString()})</span>
                            <button class="btn-action-borrow" onclick="sellRealEstate('${a.id}', ${market.price})">ขายรับเงินก้อน (+฿${(market.price - a.mortgage).toLocaleString()})</button>
                        </div>
                    `).join("");
                }
            } else if (market.type === "stock_boom") {
                const stock = cfState.assets.stocks.find(s => s.symbol === market.symbol);
                if (stock && stock.shares > 0) {
                    sellAvailable = true;
                    sellDetailsHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span>มีหุ้นในครอบครอง ${stock.shares} หุ้น (ต้นทุนเฉลี่ย ฿${stock.averageCost.toLocaleString()})</span>
                            <button class="btn-action-borrow" onclick="sellStock('${stock.symbol}', ${market.price})">ขายหุ้นทั้งหมด (+฿${(stock.shares * market.price).toLocaleString()})</button>
                        </div>
                    `;
                }
            } else if (market.type === "inflation") {
                cfState.cash -= market.price;
                addCFLog(`💸 จ่ายค่าซื้อของแพงขึ้นเงินเฟ้อ ฿${market.price.toLocaleString()}`, "doodad-log");
            }

            container.innerHTML = `
                <div class="event-card" style="border-left: 4px solid #8b5cf6;">
                    <h4 class="text-blue">🏢 ตลาดซื้อขายอสังหาฯ และหลักทรัพย์ (Market event)</h4>
                    <p class="event-card-subtitle">${market.name}</p>
                    <p>${market.desc}</p>
                    ${sellAvailable ? `
                        <div style="background:rgba(0,0,0,0.2); padding:0.75rem; border-radius:10px; margin-bottom:1rem;">
                            <label style="font-size:0.75rem; color:var(--text-secondary); display:block; margin-bottom:0.5rem;">คลิกปุ่มเพื่อดำเนินการขาย:</label>
                            ${sellDetailsHTML}
                        </div>
                    ` : `<p style="font-style:italic; font-size:0.8rem; color:rgba(255,255,255,0.2);">คุณไม่มีสินทรัพย์ประเภทนี้ที่สอดคล้องกับความต้องการของตลาดขณะนี้</p>`}
                    <button class="btn btn-green-full" onclick="clearEventCard()">ผ่าน / รับทราบ ➡️</button>
                </div>
            `;
            break;

        case "baby":
            if (cfState.childrenCount < 3) {
                cfState.childrenCount++;
                addCFLog(`👶 มีลูกเพิ่มคนที่ ${cfState.childrenCount}! รายจ่ายเพิ่มขึ้นรายเดือน ฿${cfState.expenses.childCost.toLocaleString()}`, "doodad-log");
                
                container.innerHTML = `
                    <div class="event-card" style="border-left: 4px solid #ec4899;">
                        <h4 style="color: #ec4899;">👶 มีทายาทเพิ่มขึ้น! (Add a Child)</h4>
                        <p>ขอแสดงความยินดี! สมาชิกใหม่ในครอบครัวได้เกิดขึ้นแล้ว คุณมีหน้าที่ต้องจ่ายเลี้ยงดูเพิ่มขึ้น <strong>฿${cfState.expenses.childCost.toLocaleString()}</strong> ต่อเดือน (สูงสุดไม่เกิน 3 คน)</p>
                        <button class="btn btn-green-full" onclick="clearEventCard()">ต้อนรับทารกใหม่ ➡️</button>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="event-card">
                        <h4>👶 มีลูกเพิ่ม (จำกัดสูงสุด 3 คน)</h4>
                        <p>คุณเดินตกช่องมีลูก แต่ขณะนี้ครอบครัวมีลูกครบ 3 คนตามโควตาสูงสุดแล้ว จึงไม่มีรายจ่ายเลี้ยงดูเพิ่มเติม</p>
                        <button class="btn btn-green-full" onclick="clearEventCard()">รับทราบ ➡️</button>
                    </div>
                `;
            }
            break;

        case "downsized":
            const expense = calculateCFTotalExpenses();
            cfState.cash -= expense;
            cfState.downsizedTurnsLeft = 2;
            addCFLog(`🛑 ตกงาน! จ่ายรายจ่ายรายเดือน ฿${expense.toLocaleString()} และพลาดการเล่นทอยลูกเต๋า 2 รอบ`, "doodad-log");

            container.innerHTML = `
                <div class="event-card" style="border-left: 4px solid #f97316;">
                    <h4 class="text-orange">🛑 คุณถูกเลิกจ้างชั่วคราว! (Downsized)</h4>
                    <p>บริษัทปรับลดขนาดแผนก ทำให้คุณต้องจ่ายรายจ่ายส่วนตัวรวมประจำเดือน <strong>฿${expense.toLocaleString()}</strong> ให้แก่ธนาคารทันที และต้องหยุดเดินเพื่อหางานใหม่เป็นเวลา 2 รอบการทอย</p>
                    <button class="btn btn-green-full" onclick="clearEventCard()">รับสภาพตกงาน ➡️</button>
                </div>
            `;
            break;
    }
    
    // Open the Event Modal
    document.getElementById("cf-event-modal").classList.remove("hidden");
}

// Clear event card box (closes the event modal dialog)
function clearEventCard() {
    document.getElementById("cf-event-modal").classList.add("hidden");
}

// Draw Small vs Big Deal
function drawDeal(dealType) {
    const container = document.getElementById("event-card-display");
    const dataset = dealType === "small" ? smallDeals : bigDeals;
    const card = dataset[Math.floor(Math.random() * dataset.length)];

    if (dealType === "big" && cfState.cash < 50000) {
        container.innerHTML = `
            <div class="event-card">
                <h4>🛑 เงินสดไม่เพียงพอที่จะเข้าดูดีลใหญ่</h4>
                <p>การเปิดดีลใหญ่ต้องการเงินลงทุน/เงินดาวน์สูงกว่าปกติ (ขั้นต่ำประมาณ ฿50,000) แต่คุณมีเงินสดในมือเพียง ฿${cfState.cash.toLocaleString()} แนะนำให้เริ่มจากเก็บดีลขนาดเล็กก่อนครับ</p>
                <div class="event-card-actions">
                    <button class="btn btn-card-buy" onclick="drawDeal('small')">กลับไปเลือกดีลขนาดเล็ก 📈</button>
                    <button class="btn btn-card-pass" onclick="clearEventCard()">ยกเลิกดีล ➡️</button>
                </div>
            </div>
        `;
        return;
    }

    if (card.type === "stock") {
        const sharesOptions = [100, 200, 500, 1000];
        let optionsHTML = sharesOptions.map(sh => {
            const cost = sh * card.cost;
            return `<button class="btn-action-borrow" onclick="buyStockDeal('${card.symbol}', ${sh}, ${card.cost}, ${card.cashFlow})">ซื้อ ${sh} หุ้น (฿${cost.toLocaleString()})</button>`;
        }).join(" ");

        container.innerHTML = `
            <div class="event-card" style="border-left: 4px solid #3b82f6;">
                <h4>📈 เสนอซื้อโอกาสตลาดหลักทรัพย์ (${card.symbol})</h4>
                <p class="event-card-subtitle">${card.name}</p>
                <p>${card.desc}</p>
                <div class="event-card-stats">
                    <div class="card-stat">ราคาปัจจุบัน: <strong>฿${card.cost.toLocaleString()}/หุ้น</strong></div>
                    <div class="card-stat">กรอบราคาตลาดทั่วไป: <strong>${card.range}</strong></div>
                    <div class="card-stat">ปันผลต่อหุ้น/เดือน: <strong>+฿${card.cashFlow || 0}</strong></div>
                </div>
                <div style="background:rgba(0,0,0,0.2); padding:0.75rem; border-radius:10px; margin-bottom:1rem;">
                    <label style="font-size:0.75rem; color:var(--text-secondary); display:block; margin-bottom:0.5rem;">เลือกซื้อจำนวนหุ้นที่เหมาะสม:</label>
                    <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                        ${optionsHTML}
                    </div>
                </div>
                <button class="btn btn-card-pass" onclick="clearEventCard()">ผ่านข้อเสนอนี้ ➡️</button>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="event-card" style="border-left: 4px solid #3b82f6;">
                <h4>🏢 โอกาสลงทุนอสังหาฯ และธุรกิจส่วนตัว</h4>
                <p class="event-card-subtitle">${card.name}</p>
                <p>${card.desc}</p>
                <div class="event-card-stats">
                    <div class="card-stat">ราคาสินทรัพย์ทั้งหมด: <strong>฿${card.cost.toLocaleString()}</strong></div>
                    <div class="card-stat">เงินสดดาวน์เริ่มต้น: <strong class="text-green">฿${card.downPayment.toLocaleString()}</strong></div>
                    <div class="card-stat">กระแสเงินสดเข้ากระเป๋า: <strong class="text-green">+฿${card.cashFlow.toLocaleString()}/เดือน</strong></div>
                    <div class="card-stat">ยอดหนี้จำนอง (Mortgage): <strong>฿${(card.mortgage || 0).toLocaleString()}</strong></div>
                </div>
                <div class="event-card-actions">
                    <button class="btn btn-card-buy" onclick="buyAssetDeal('${card.name}', '${card.type}', ${card.cost}, ${card.downPayment}, ${card.mortgage || 0}, ${card.cashFlow})">ตกลงลงทุน ➕</button>
                    <button class="btn btn-card-pass" onclick="clearEventCard()">ผ่านดีลนี้ ➡️</button>
                </div>
            </div>
        `;
    }
}

// Purchase Stock Deal
function buyStockDeal(symbol, shares, costPerShare, dividendPerShare) {
    const totalCost = shares * costPerShare;
    if (cfState.cash < totalCost) {
        alert("คุณมีเงินสดไม่เพียงพอสำหรับการซื้อจำนวนหุ้นนี้! กรุณากู้ธนาคารมาก่อนตัดสินใจซื้อครับ");
        return;
    }

    cfState.cash -= totalCost;
    showFloatingEffect(totalCost, 'minus');

    const existing = cfState.assets.stocks.find(s => s.symbol === symbol);
    if (existing) {
        const totalShares = existing.shares + shares;
        const totalValue = (existing.shares * existing.averageCost) + totalCost;
        existing.averageCost = Math.round(totalValue / totalShares);
        existing.shares = totalShares;
    } else {
        cfState.assets.stocks.push({
            symbol,
            shares,
            averageCost: costPerShare,
            dividendPerShare
        });
    }

    addCFLog(`📈 ลงทุนซื้อหุ้น ${symbol} จำนวน ${shares} หุ้น ที่ราคา ฿${costPerShare.toLocaleString()} (จ่ายเงินรวม ฿${totalCost.toLocaleString()})`, "deal-log");
    clearEventCard();
    updateCFUI();
}

// Purchase Real Estate or Business Asset Deal
function buyAssetDeal(name, assetType, cost, downPayment, mortgage, monthlyCashflow) {
    if (cfState.cash < downPayment) {
        alert("คุณมีเงินสดดาวน์ไม่เพียงพอ! กรุณากู้เงินธนาคารมาก่อนตัดสินใจลงทุนครับ");
        return;
    }

    cfState.cash -= downPayment;
    showFloatingEffect(downPayment, 'minus');

    const newAsset = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        name,
        cost,
        downPayment,
        mortgage,
        cashFlow: monthlyCashflow
    };

    if (assetType === "realestate") {
        let category = "house";
        if (name.includes("Condo") || name.includes("คอนโด")) category = "condo";
        else if (name.includes("Apartment") || name.includes("อพาร์ตเมนต์")) category = "apartment";

        newAsset.category = category;
        cfState.assets.realEstate.push(newAsset);
    } else {
        cfState.assets.businesses.push(newAsset);
    }

    addCFLog(`🏢 ตกลงลงทุนใน ${name} (เงินดาวน์ ฿${downPayment.toLocaleString()}, กระแสเงินสด Passive +฿${monthlyCashflow.toLocaleString()}/เดือน)`, "deal-log");
    clearEventCard();
    updateCFUI();
}

// Sell Real Estate Asset through Market Offer
function sellRealEstate(assetId, marketPrice) {
    const asset = cfState.assets.realEstate.find(re => re.id === assetId);
    if (!asset) return;

    const equity = marketPrice - asset.mortgage;
    cfState.cash += equity;
    showFloatingEffect(equity, 'plus');

    cfState.assets.realEstate = cfState.assets.realEstate.filter(re => re.id !== assetId);

    addCFLog(`🏢 ขายอสังหาริมทรัพย์ ${asset.name} ที่ราคาตลาด ฿${marketPrice.toLocaleString()} (หักหนี้กู้ยืม ฿${asset.mortgage.toLocaleString()} รับเงินสุทธิ ฿${equity.toLocaleString()})`, "market-log");
    clearEventCard();
    updateCFUI();
}

// Sell Stock Asset through Market Offer
function sellStock(symbol, marketPrice) {
    const stock = cfState.assets.stocks.find(s => s.symbol === symbol);
    if (!stock) return;

    const proceeds = stock.shares * marketPrice;
    cfState.cash += proceeds;
    showFloatingEffect(proceeds, 'plus');

    cfState.assets.stocks = cfState.assets.stocks.filter(s => s.symbol !== symbol);

    addCFLog(`📈 ขายหุ้น ${symbol} ทั้งหมดจำนวน ${stock.shares} หุ้น ที่ราคาตลาด ฿${marketPrice.toLocaleString()} (รับเงินก้อนสุทธิ ฿${proceeds.toLocaleString()})`, "market-log");
    clearEventCard();
    updateCFUI();
}

// Borrow Bank loan (฿10,000 chunks)
function borrowBank() {
    cfState.cash += 10000;
    showFloatingEffect(10000, 'plus');
    cfState.liabilities.bankLoan += 10000;
    cfState.expenses.bankInterest += 1000; // 10% Interest rate

    addCFLog(`💵 กู้ยืมเงินธนาคารเพิ่ม +฿10,000 (เพิ่มรายจ่ายดอกเบี้ย ฿1,000/เดือน)`, "deal-log");
    updateCFUI();
}

// Repay Bank loan (฿10,000 chunks)
function repayBank() {
    if (cfState.liabilities.bankLoan < 10000) {
        alert("คุณไม่มียอดค้างชำระเงินกู้ยืมธนาคารนี้ครับ");
        return;
    }
    if (cfState.cash < 10000) {
        alert("เงินสดในมือไม่เพียงพอชำระหนี้ ฿10,000! กรุณาสะสมเงินจากกระแสรายเดือนก่อนครับ");
        return;
    }

    cfState.cash -= 10000;
    showFloatingEffect(10000, 'minus');
    cfState.liabilities.bankLoan -= 10000;
    cfState.expenses.bankInterest -= 1000;

    addCFLog(`💵 คืนชำระหนี้กู้ธนาคาร -฿10,000 (ลดค่าใช้จ่ายดอกเบี้ยลง ฿1,000/เดือน)`, "deal-log");
    updateCFUI();
}

// Repay specific career debts
function repayDebt(debtType) {
    let debtValue = 0;
    let monthlySaving = 0;

    if (debtType === "creditCard") {
        debtValue = cfState.liabilities.creditCard;
        monthlySaving = cfState.expenses.creditCard;
    } else if (debtType === "carLoan") {
        debtValue = cfState.liabilities.carLoan;
        monthlySaving = cfState.expenses.carLoan;
    }

    if (debtValue === 0) {
        alert("หนี้สินส่วนนี้ได้รับการปิดยอดชำระหมดเรียบร้อยแล้วครับ");
        return;
    }

    if (cfState.cash < debtValue) {
        alert(`เงินสดไม่เพียงพอปิดหนี้สินจำนวน ฿${debtValue.toLocaleString()}! กรุณาสะสมเงินสดเพิ่มขึ้นก่อนครับ`);
        return;
    }

    cfState.cash -= debtValue;
    showFloatingEffect(debtValue, 'minus');
    
    if (debtType === "creditCard") {
        cfState.liabilities.creditCard = 0;
        cfState.expenses.creditCard = 0;
        addCFLog(`🎉 ปิดหนี้บัตรเครดิตสะสมทั้งหมด -฿${debtValue.toLocaleString()} สำเร็จ! ลดรายจ่ายประจำลง ฿${monthlySaving.toLocaleString()}/เดือน`, "deal-log");
    } else if (debtType === "carLoan") {
        cfState.liabilities.carLoan = 0;
        cfState.expenses.carLoan = 0;
        addCFLog(`🎉 ปิดหนี้กู้ซื้อรถยนต์สะสมทั้งหมด -฿${debtValue.toLocaleString()} สำเร็จ! ลดรายจ่ายประจำลง ฿${monthlySaving.toLocaleString()}/เดือน`, "deal-log");
    }

    updateCFUI();
}

// Add event logs
function addCFLog(text, logClass = "system-log") {
    const logs = document.getElementById("cf-game-logs");
    const entry = document.createElement("div");
    entry.className = `log-entry ${logClass}`;
    entry.innerText = `[รอบที่ ${cfState.turnCount}] ${text}`;
    logs.appendChild(entry);
    logs.scrollTop = logs.scrollHeight;
}

// Math calculation helper
function calculateCFPassiveIncome() {
    let passive = 0;

    cfState.assets.realEstate.forEach(re => {
        passive += re.cashFlow;
    });

    cfState.assets.businesses.forEach(b => {
        passive += b.cashFlow;
    });

    cfState.assets.stocks.forEach(s => {
        passive += s.shares * (s.dividendPerShare || 0);
    });

    cfState.passiveIncome = passive;
    return passive;
}

function calculateCFTotalIncome() {
    const passive = calculateCFPassiveIncome();
    cfState.totalIncome = cfState.salary + passive;
    return cfState.totalIncome;
}

function calculateCFTotalExpenses() {
    let totalExp = 0;
    Object.values(cfState.expenses).forEach(v => {
        totalExp += v;
    });
    totalExp -= cfState.expenses.childCost; 
    totalExp += cfState.childrenCount * cfState.expenses.childCost;
    return totalExp;
}

function calculateCFNetFlow() {
    const totalInc = calculateCFTotalIncome();
    const totalExp = calculateCFTotalExpenses();
    return totalInc - totalExp;
}

// Sync Game State variables with UI ledger components
function updateCFUI() {
    if (!cfState.activeGame) return;

    document.getElementById("game-turn-count").innerText = cfState.turnCount;
    document.getElementById("game-cash-on-hand").innerText = `฿${cfState.cash.toLocaleString()}`;
    document.getElementById("cf-display-job").innerText = `อาชีพ: ${cfState.profession}`;

    const passive = calculateCFPassiveIncome();
    const expenses = calculateCFTotalExpenses();
    const income = calculateCFTotalIncome();
    const netFlow = income - expenses;

    document.getElementById("cf-net-cashflow-val").innerText = `฿${netFlow.toLocaleString()}`;
    
    if (netFlow < 0) {
        document.getElementById("cf-net-cashflow-val").className = "text-red";
    } else {
        document.getElementById("cf-net-cashflow-val").className = "text-green";
    }

    document.getElementById("progress-val-passive").innerText = `฿${passive.toLocaleString()}`;
    document.getElementById("progress-val-expenses").innerText = `฿${expenses.toLocaleString()}`;

    let progressPct = 0;
    if (expenses > 0) {
        progressPct = Math.round((passive / expenses) * 100);
    }
    
    document.getElementById("cf-passive-progress-bar").style.width = `${Math.min(100, progressPct)}%`;
    document.getElementById("cf-escape-status").innerText = `ความคืบหน้าการเป็นอิสระทางการเงิน: ${progressPct}%`;

    document.getElementById("cf-salary-val").innerText = `฿${cfState.salary.toLocaleString()}`;
    document.getElementById("cf-interest-val").innerText = `฿${cfState.assets.stocks.reduce((acc, s) => acc + (s.shares * (s.dividendPerShare || 0)), 0).toLocaleString()}`;
    document.getElementById("cf-realestate-inc-val").innerText = `฿${cfState.assets.realEstate.reduce((acc, re) => acc + re.cashFlow, 0).toLocaleString()}`;
    document.getElementById("cf-business-inc-val").innerText = `฿${cfState.assets.businesses.reduce((acc, b) => acc + b.cashFlow, 0).toLocaleString()}`;
    document.getElementById("cf-total-income-val").innerText = `฿${income.toLocaleString()}`;

    document.getElementById("cf-tax-val").innerText = `฿${cfState.expenses.taxes.toLocaleString()}`;
    document.getElementById("cf-mortgage-pay-val").innerText = `฿${cfState.expenses.mortgage.toLocaleString()}`;
    document.getElementById("cf-car-pay-val").innerText = `฿${cfState.expenses.carLoan.toLocaleString()}`;
    document.getElementById("cf-cc-pay-val").innerText = `฿${cfState.expenses.creditCard.toLocaleString()}`;
    document.getElementById("cf-retail-pay-val").innerText = `฿${cfState.expenses.retailDebt.toLocaleString()}`;
    document.getElementById("cf-child-count-lbl").innerText = cfState.childrenCount;
    document.getElementById("cf-child-pay-val").innerText = `฿${(cfState.childrenCount * cfState.expenses.childCost).toLocaleString()}`;
    document.getElementById("cf-bank-interest-val").innerText = `฿${cfState.expenses.bankInterest.toLocaleString()}`;
    document.getElementById("cf-total-expenses-val").innerText = `฿${expenses.toLocaleString()}`;

    renderLedgerLists();

    document.getElementById("cf-mortgage-liab-val").innerText = `฿${cfState.liabilities.mortgage.toLocaleString()}`;
    document.getElementById("cf-car-liab-val").innerText = `฿${cfState.liabilities.carLoan.toLocaleString()}`;
    document.getElementById("cf-cc-liab-val").innerText = `฿${cfState.liabilities.creditCard.toLocaleString()}`;
    document.getElementById("cf-retail-liab-val").innerText = `฿${cfState.liabilities.retail.toLocaleString()}`;
    document.getElementById("cf-bank-liab-val").innerText = `฿${cfState.liabilities.bankLoan.toLocaleString()}`;

    document.getElementById("btn-pay-credit-card").innerText = `ปิดหนี้บัตรเครดิต (฿${cfState.liabilities.creditCard.toLocaleString()})`;
    document.getElementById("btn-pay-car-loan").innerText = `ปิดหนี้รถยนต์ (฿${cfState.liabilities.carLoan.toLocaleString()})`;

    if (passive > expenses && cfState.activeGame) {
        triggerVictory();
    }
}

// Render Asset listing inside Ledger
function renderLedgerLists() {
    const stockContainer = document.getElementById("cf-list-stocks");
    stockContainer.innerHTML = "";
    if (cfState.assets.stocks.length === 0) {
        stockContainer.innerHTML = `<div class="ledger-empty-msg">ไม่มีหุ้นกู้ในครอบครอง</div>`;
    } else {
        cfState.assets.stocks.forEach(s => {
            const item = document.createElement("div");
            item.className = "ledger-item";
            item.innerHTML = `
                <span>${s.symbol} (${s.shares} หุ้น, ต้นทุน ฿${s.averageCost.toLocaleString()})</span>
                <span class="ledger-item-val">+฿${(s.shares * (s.dividendPerShare || 0)).toLocaleString()}/ด.</span>
            `;
            stockContainer.appendChild(item);
        });
    }

    const reContainer = document.getElementById("cf-list-realestate");
    reContainer.innerHTML = "";
    if (cfState.assets.realEstate.length === 0) {
        reContainer.innerHTML = `<div class="ledger-empty-msg">ไม่มีอสังหาฯ ในครอบครอง</div>`;
    } else {
        cfState.assets.realEstate.forEach(re => {
            const item = document.createElement("div");
            item.className = "ledger-item";
            item.innerHTML = `
                <span>${re.name} (จำนอง ฿${re.mortgage.toLocaleString()})</span>
                <span class="ledger-item-val">+฿${re.cashFlow.toLocaleString()}/ด.</span>
            `;
            reContainer.appendChild(item);
        });
    }

    const bizContainer = document.getElementById("cf-list-businesses");
    bizContainer.innerHTML = "";
    if (cfState.assets.businesses.length === 0) {
        bizContainer.innerHTML = `<div class="ledger-empty-msg">ไม่มีธุรกิจในครอบครอง</div>`;
    } else {
        cfState.assets.businesses.forEach(b => {
            const item = document.createElement("div");
            item.className = "ledger-item";
            item.innerHTML = `
                <span>${b.name}</span>
                <span class="ledger-item-val">+฿${b.cashFlow.toLocaleString()}/ด.</span>
            `;
            bizContainer.appendChild(item);
        });
    }
}

// Victory screen setup
function triggerVictory() {
    cfState.activeGame = false;
    
    document.getElementById("vic-job").innerText = cfState.profession;
    document.getElementById("vic-turns").innerText = cfState.turnCount;
    document.getElementById("vic-passive").innerText = `฿${cfState.passiveIncome.toLocaleString()}`;
    document.getElementById("vic-expenses").innerText = `฿${calculateCFTotalExpenses().toLocaleString()}`;

    document.getElementById("cf-victory-modal").classList.remove("hidden");
    addCFLog("🏆 ยินดีด้วย! คุณหลุดพ้นจากวงจรหนูถีบจักร (Rat Race) สำเร็จและชนะเกมนี้!", "payday-log");
}

// Collapsible play guide toggle
function togglePlayGuide() {
    const content = document.getElementById("guide-content");
    const arrow = document.getElementById("guide-arrow");
    if (content.classList.contains("hidden")) {
        content.classList.remove("hidden");
        arrow.style.transform = "rotate(180deg)";
    } else {
        content.classList.add("hidden");
        arrow.style.transform = "rotate(0deg)";
    }
}

// In-game Guide Modal controllers
function openCFGuideModal() {
    document.getElementById("cf-guide-modal").classList.remove("hidden");
}

// In-game Guide Modal close
function closeCFGuideModal() {
    document.getElementById("cf-guide-modal").classList.add("hidden");
}

// In-game Event Card Modal controllers
function openCFEventModal() {
    document.getElementById("cf-event-modal").classList.remove("hidden");
}

function closeCFEventModal() {
    document.getElementById("cf-event-modal").classList.add("hidden");
}

// Mobile Tab switcher for Cashflow Game layout
function switchCFMobileTab(tabName) {
    const boardView = document.getElementById("cf-game-board-view");
    if (boardView) {
        boardView.setAttribute("data-active-tab", tabName);
    }
    
    // Update active state class on sub-tab navigation buttons
    document.querySelectorAll(".cf-nav-tab-btn").forEach(btn => btn.classList.remove("active"));
    const activeBtn = document.getElementById(`cf-btn-tab-${tabName}`);
    if (activeBtn) {
        activeBtn.classList.add("active");
    }
}

// Visual Floating Cash effect (+/- amount animation)
function showFloatingEffect(amount, type) {
    if (amount === 0) return;
    const container = document.getElementById("game-cash-on-hand");
    if (!container) return;
    
    const floater = document.createElement("span");
    floater.className = `floating-effect ${type === 'plus' ? 'text-green' : 'text-red'}`;
    floater.innerText = `${type === 'plus' ? '+' : '-'}฿${Math.abs(amount).toLocaleString()}`;
    floater.style.position = "absolute";
    floater.style.left = "50%";
    floater.style.top = "-22px";
    floater.style.transform = "translateX(-50%)";
    floater.style.fontSize = "1rem";
    floater.style.fontWeight = "bold";
    floater.style.pointerEvents = "none";
    floater.style.zIndex = "100";
    floater.style.animation = "floatUpFade 1.2s ease-out forwards";
    
    // Ensure parent is relative
    container.parentElement.style.position = "relative";
    container.parentElement.appendChild(floater);
    
    setTimeout(() => {
        floater.remove();
    }, 1200);
}

// ==========================================
// EGAT PVD PROVIDENT FUND ANALYZER ENGINE
// ==========================================

const egatPvdPolicies = {
    egat1: {
        name: "EGAT1",
        label: "นโยบายตราสารหนี้มั่นคง (Conservative PVD)",
        baseYield: 3.9,
        allocations: [
            { name: "ตราสารหนี้รัฐบาลและตราสารหนี้ไทย", weight: 70, type: "bond" },
            { name: "หุ้นสามัญไทยขนาดใหญ่", weight: 15, type: "eq" },
            { name: "ตราสารหนี้ต่างประเทศคุณภาพสูง", weight: 10, type: "alt" },
            { name: "เงินสดสำรองและเงินฝากระยะสั้น", weight: 5, type: "alt" }
        ],
        subFunds: [
            { name: "EGAT2 MFC (กองตราสารหนี้มั่นคงทวีปัญญา)", manager: "MFC" },
            { name: "EGAT1 KTAM (กองตราสารหนี้ภาครัฐเพิ่มคุณค่า)", manager: "KTAM" }
        ]
    },
    egat2: {
        name: "EGAT2",
        label: "นโยบายผสมทางเลือก (Balanced PVD)",
        baseYield: 4.5,
        allocations: [
            { name: "ตราสารหนี้ไทยชั้นดี", weight: 40, type: "bond" },
            { name: "หุ้นสามัญไทย (SET100)", weight: 35, type: "eq" },
            { name: "หุ้นต่างประเทศตลาดเกิดใหม่และพัฒนาแล้ว", weight: 15, type: "globeq" },
            { name: "กองทุนรวมอสังหาริมทรัพย์และ REITs", weight: 10, type: "alt" }
        ],
        subFunds: [
            { name: "EGAT1E MFC (กองผสมเพื่อการเลี้ยงชีพระดับกลาง)", manager: "MFC" },
            { name: "EGAT9 MFC (กองทุนรวมหุ้นทวีทรัพย์ กฟผ.)", manager: "MFC" },
            { name: "EGAT5 KTAM (กองผสมสัดส่วนยืดหยุ่น)", manager: "KTAM" },
            { name: "EGAT6 UOBAM (กองทุน PVD เพื่อความมั่นคงยุคใหม่)", manager: "UOBAM" }
        ]
    },
    egat4: {
        name: "EGAT4",
        label: "นโยบายหุ้นต่างประเทศเติบโต (Global Aggressive PVD)",
        baseYield: 11.4,
        allocations: [
            { name: "หุ้นต่างประเทศทั่วโลก (Global Growth Equities)", weight: 60, type: "globeq" },
            { name: "หุ้นสามัญไทยขยายตัวสูง", weight: 20, type: "eq" },
            { name: "ตราสารหนี้คุณภาพสูงระยะสั้น", weight: 10, type: "bond" },
            { name: "สินทรัพย์ทางเลือก ทองคำ หรือสินค้าโภคภัณฑ์", weight: 10, type: "alt" }
        ],
        subFunds: [
            { name: "EGATO SCBAM (กองเปิดดัชนีหุ้นต่างประเทศ)", manager: "SCBAM" },
            { name: "EGATP KTAM (กองตราสารทุนต่างประเทศทวีมูลค่า)", manager: "KTAM" }
        ]
    },
    egat5: {
        name: "EGAT5",
        label: "นโยบายเมกะเทรนด์ & ESG (Sustainable Innovation PVD)",
        baseYield: 14.2,
        allocations: [
            { name: "หุ้นนวัตกรรม เมกะเทรนด์โลก และเทคโนโลยีเปลี่ยนโลก", weight: 50, type: "globeq" },
            { name: "หุ้นเป็นมิตรกับสิ่งแวดล้อมและความยั่งยืน ESG", weight: 20, type: "globeq" },
            { name: "ตราสารหนี้โลกเกรดลงทุน", weight: 15, type: "bond" },
            { name: "กองทุนโครงสร้างพื้นฐานพลังงานสะอาดและสาธารณูปโภค", weight: 10, type: "alt" },
            { name: "เงินฝากสกุลต่างประเทศสำรอง", weight: 5, type: "alt" }
        ],
        subFunds: [
            { name: "EGATGP MFC (กองทุนเปิด เมกะเทรนด์ความยั่งยืน ก กฟผ.)", manager: "MFC" }
        ]
    }
};

const egatMacroEvents = [
    {
        id: "fed_cuts",
        emoji: "💵",
        title: "เฟดหั่นดอกเบี้ยนโยบาย 0.50% (กันยายน 2567)",
        desc: "วันที่ 18 กันยายน 2567 ธนาคารกลางสหรัฐฯ (Fed) ประกาศลดอัตราดอกเบี้ย 0.50% เหลือช่วง 4.75-5.00% เพื่อพยุงตลาดแรงงานและเศรษฐกิจโลก",
        yieldModifiers: { egat1: 0.5, egat2: 1.2, egat4: 3.5, egat5: 4.2 },
        ratings: { egat1: "pos", egat2: "pos", egat4: "pos", egat5: "pos" },
        analysis: "เหตุการณ์จริงนี้ลดต้นทุนการเงินของบริษัทเติบโตทั่วโลก ดันดัชนี S&P 500 ทำราคาสูงสุดประวัติศาสตร์ (All-Time High) ส่งผลดีมากต่อพอร์ต EGAT4 และ EGAT5 ที่ถือสินทรัพย์เสี่ยงสูงในตลาดโลก"
    },
    {
        id: "china_stimulus",
        emoji: "🇨🇳",
        title: "จีนอัดมาตรการกระตุ้นเศรษฐกิจใหญ่ (2567)",
        desc: "ธนาคารกลางจีน (PBOC) ประกาศแผนกระตุ้นเศรษฐกิจครั้งใหญ่ที่สุดนับตั้งแต่โควิด รวมถึงการลด RRR 0.5% และลดดอกเบี้ยซื้อคืนพันธบัตร",
        yieldModifiers: { egat1: 0.0, egat2: 2.4, egat4: 1.8, egat5: 1.5 },
        ratings: { egat1: "neu", egat2: "pos", egat4: "pos", egat5: "pos" },
        analysis: "เหตุการณ์จริงนี้ดันตลาดหุ้นเอเชียและหุ้นกลุ่มสินค้าโภคภัณฑ์ฟื้นตัวอย่างรวดเร็ว ส่งผลบวกต่อ EGAT2 (มีหุ้นไทยและหุ้นภูมิภาค) และกองทุนที่มีสัดส่วนในตลาดพัฒนาแล้ว"
    },
    {
        id: "inflation_spike",
        emoji: "⚡",
        title: "วิกฤตเงินเฟ้อและห่วงโซ่อุปทานโลก (2565-2566)",
        desc: "ปัญหาชะงักงันของอุปทานและสงครามยูเครน ส่งผลให้เงินเฟ้อทั่วไปของสหรัฐฯ ทะยานแตะระดับ 9.1% (สูงสุดในรอบ 40 ปี) บีบให้ทั่วโลกขึ้นดอกเบี้ยแรง",
        yieldModifiers: { egat1: -1.5, egat2: -4.8, egat4: -12.5, egat5: -10.2 },
        ratings: { egat1: "neg", egat2: "neg", egat4: "neg", egat5: "neg" },
        analysis: "การขึ้นดอกเบี้ยเชิงรุกของธนาคารกลางทั่วโลกกดดันราคาพันธบัตรและหุ้นนวัตกรรมเทคโนโลยีอย่างรุนแรง ส่งผลกระทบเชิงลบอย่างหนักต่อพอร์ตกองทุนสำรองเลี้ยงชีพของ กฟผ. ทุกประเภท"
    },
    {
        id: "baht_strong",
        emoji: "🇹🇭",
        title: "เงินบาทแข็งค่าแตะ 32.20 บาท/ดอลลาร์ (2567)",
        desc: "ราคาทองคำโลกที่พุ่งสูงและการลดดอกเบี้ยนโยบายของสหรัฐฯ ดึงเงินทุนต่างชาติไหลเข้า ดันเงินบาทแข็งค่าขึ้นอย่างรวดเร็วจาก 36.80 บาท/ดอลลาร์",
        yieldModifiers: { egat1: 0.2, egat2: -0.5, egat4: -4.5, egat5: -4.2 },
        ratings: { egat1: "neu", egat2: "neg", egat4: "neg", egat5: "neg" },
        analysis: "การแข็งค่าของเงินบาททำให้เกิดผลขาดทุนจากอัตราแลกเปลี่ยน (FX Translation Loss) เมื่อแปลงมูลค่าสินทรัพย์ต่างประเทศกลับเป็นสกุลเงินบาท ส่งผลลบชั่วคราวต่อพอร์ต EGAT4 และ EGAT5"
    }
];

let activeEgatPolicy = "egat1";
let activeEgatEvent = null;
let egatYieldModifier = { egat1: 0, egat2: 0, egat4: 0, egat5: 0 };
let activeEgatChartTab = "projection";

function initEgatFundsPage() {
    // Duplicate ticker tape items for seamless continuous looping marquee
    const tickerTrack = document.getElementById("egat-ticker-tape");
    if (tickerTrack && !tickerTrack.dataset.duplicated) {
        const content = tickerTrack.innerHTML;
        tickerTrack.innerHTML = content + content + content; // Triple it to fill widescreen perfectly
        tickerTrack.dataset.duplicated = "true";
    }

    // Fetch real-time market data from Vercel serverless proxy endpoint
    fetch('/api/prices')
        .then(res => res.json())
        .then(data => {
            if (data.error) return;
            
            // Update SET INDEX
            if (data.set && data.set.price) {
                document.querySelectorAll('#tick-val-set').forEach(el => el.innerText = data.set.price);
                document.querySelectorAll('#tick-chg-set').forEach(el => {
                    const val = parseFloat(data.set.change);
                    el.className = val >= 0 ? "ticker-change text-green" : "ticker-change text-red";
                    el.innerText = `${val >= 0 ? '▲' : '▼'} ${Math.abs(val).toFixed(2)}%`;
                });
            }

            // Update S&P 500
            if (data.sp500 && data.sp500.price) {
                document.querySelectorAll('#tick-val-sp500').forEach(el => el.innerText = data.sp500.price);
                document.querySelectorAll('#tick-chg-sp500').forEach(el => {
                    const val = parseFloat(data.sp500.change);
                    el.className = val >= 0 ? "ticker-change text-green" : "ticker-change text-red";
                    el.innerText = `${val >= 0 ? '▲' : '▼'} ${Math.abs(val).toFixed(2)}%`;
                });
            }

            // Update NASDAQ 100
            if (data.nasdaq && data.nasdaq.price) {
                document.querySelectorAll('#tick-val-nasdaq').forEach(el => el.innerText = data.nasdaq.price);
                document.querySelectorAll('#tick-chg-nasdaq').forEach(el => {
                    const val = parseFloat(data.nasdaq.change);
                    el.className = val >= 0 ? "ticker-change text-green" : "ticker-change text-red";
                    el.innerText = `${val >= 0 ? '▲' : '▼'} ${Math.abs(val).toFixed(2)}%`;
                });
            }

            // Update USD/THB exchange rate
            if (data.usdThb) {
                document.querySelectorAll('#tick-val-usdthb').forEach(el => el.innerText = `฿${data.usdThb}`);
            }
        })
        .catch(err => console.error("Failed to fetch live prices:", err));

    // Bind policy card selections
    document.querySelectorAll(".policy-select-card").forEach(card => {
        card.addEventListener("click", (e) => {
            const currentCard = e.currentTarget;
            document.querySelectorAll(".policy-select-card").forEach(c => c.classList.remove("active"));
            currentCard.classList.add("active");
            
            const policy = currentCard.getAttribute("data-policy");
            selectEgatPolicy(policy);
        });
    });

    // Bind table row selections to select policy
    document.querySelectorAll(".egat-comparison-table tbody tr").forEach(row => {
        row.addEventListener("click", (e) => {
            const policy = e.currentTarget.getAttribute("data-row-policy");
            selectEgatPolicy(policy);
            
            // Sync with selector cards active state
            document.querySelectorAll(".policy-select-card").forEach(c => {
                c.classList.remove("active");
                if (c.getAttribute("data-policy") === policy) c.classList.add("active");
            });
        });
    });

    // Bind inputs changes
    document.getElementById("egat-salary").addEventListener("input", calculateEgatDca);
    document.getElementById("egat-contrib-rate").addEventListener("change", calculateEgatDca);
    document.getElementById("egat-service-years").addEventListener("change", calculateEgatDca);
    document.getElementById("egat-chart-mode-checkbox").addEventListener("change", calculateEgatDca);

    // Bind contribution percentage pills clicks
    document.querySelectorAll(".pct-pill").forEach(pill => {
        pill.addEventListener("click", (e) => {
            const pct = e.currentTarget.getAttribute("data-pct");
            const select = document.getElementById("egat-contrib-rate");
            if (select) {
                select.value = pct;
                // Dispatch event to run calculateEgatDca
                const event = new Event('change');
                select.dispatchEvent(event);
            }
        });
    });
    
    const dcaYearsSlider = document.getElementById("egat-dca-years");
    dcaYearsSlider.addEventListener("input", (e) => {
        document.getElementById("egat-dca-years-val").innerText = `${e.target.value} ปี`;
        calculateEgatDca();
    });

    // Render Macro events selection grid
    renderEgatMacroEvents();

    // Bind chart tab clicks
    const btnProj = document.getElementById("btn-chart-proj");
    const btnActual = document.getElementById("btn-chart-actual");
    const compareToggleContainer = document.querySelector(".egat-toggle-switch-container");

    if (btnProj && btnActual) {
        btnProj.addEventListener("click", () => {
            activeEgatChartTab = "projection";
            btnProj.classList.add("active");
            btnActual.classList.remove("active");
            if (compareToggleContainer) compareToggleContainer.style.display = "flex";
            
            // Show default projection legends
            const legendBox = document.querySelector(".chart-legend-egat");
            if (legendBox) {
                legendBox.innerHTML = `
                    <span><span class="legend-dot" style="background: #3b82f6;"></span>สะสมพนักงาน</span>
                    <span><span class="legend-dot" style="background: #a855f7;"></span>สมทบจาก กฟผ.</span>
                    <span><span class="legend-dot" style="background: #10b981;"></span>มูลค่าพอร์ตรวม</span>
                `;
            }
            calculateEgatDca();
        });

        btnActual.addEventListener("click", () => {
            activeEgatChartTab = "actual";
            btnActual.classList.add("active");
            btnProj.classList.remove("active");
            if (compareToggleContainer) compareToggleContainer.style.display = "none";
            
            // Show actual returns legends
            const legendBox = document.querySelector(".chart-legend-egat");
            if (legendBox) {
                legendBox.innerHTML = `
                    <span><span class="legend-dot" style="background: #3b82f6;"></span>ปี 2567</span>
                    <span><span class="legend-dot" style="background: #a855f7;"></span>ปี 2568</span>
                `;
            }
            drawEgatActualReturnsChart();
        });
    }

    // Set initial view
    selectEgatPolicy(activeEgatPolicy);
}

function drawEgatDonutChart(allocations) {
    const svg = document.getElementById("egat-donut-chart");
    if (!svg) return;
    svg.innerHTML = "";

    const radius = 45;
    const cx = 70;
    const cy = 70;
    const circumference = 2 * Math.PI * radius; // Approx 282.743
    
    let cumulativePercent = 0;
    
    allocations.forEach(alloc => {
        const percent = alloc.weight;
        const strokeDashArray = `${(percent / 100) * circumference} ${circumference}`;
        const strokeDashOffset = `-${(cumulativePercent / 100) * circumference}`;
        
        let strokeColor = "#fbbf24";
        if (alloc.type === "bond") strokeColor = "#10b981";
        else if (alloc.type === "eq") strokeColor = "#3b82f6";
        else if (alloc.type === "globeq") strokeColor = "#a855f7";

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", cx.toString());
        circle.setAttribute("cy", cy.toString());
        circle.setAttribute("r", radius.toString());
        circle.setAttribute("class", "donut-segment");
        circle.setAttribute("stroke", strokeColor);
        circle.setAttribute("stroke-dasharray", strokeDashArray);
        circle.setAttribute("stroke-dashoffset", strokeDashOffset);
        circle.setAttribute("fill", "none");

        // Hover micro interactions to change donut center labels
        circle.addEventListener("mouseenter", () => {
            document.getElementById("donut-center-label").innerText = alloc.name.substring(0, 10);
            document.getElementById("donut-center-value").innerText = `${percent}%`;
            document.getElementById("donut-center-value").style.color = strokeColor;
        });

        circle.addEventListener("mouseleave", () => {
            document.getElementById("donut-center-label").innerText = "แผนสินทรัพย์";
            document.getElementById("donut-center-value").innerText = "PVD";
            document.getElementById("donut-center-value").style.color = "#a855f7";
        });

        svg.appendChild(circle);
        cumulativePercent += percent;
    });
}

function selectEgatPolicy(policyId) {
    activeEgatPolicy = policyId;
    const policy = egatPvdPolicies[policyId];
    
    // Update active row highlighted state
    document.querySelectorAll(".egat-comparison-table tbody tr").forEach(row => {
        row.classList.remove("active-row");
        if (row.getAttribute("data-row-policy") === policyId) row.classList.add("active-row");
    });

    // Update labels and indicators
    document.getElementById("allocation-policy-badge").innerText = policy.name;
    document.getElementById("allocation-policy-badge").className = `active-policy-title-badge bg-${policyId === 'egat1' ? 'green' : policyId === 'egat2' ? 'blue' : policyId === 'egat4' ? 'orange' : 'purple'}`;
    
    // Draw Donut SVG
    drawEgatDonutChart(policy.allocations);
    
    // Render allocation legend items on side
    const allocContainer = document.getElementById("policy-allocations-list");
    allocContainer.innerHTML = "";
    policy.allocations.forEach(alloc => {
        const item = document.createElement("div");
        item.style.display = "flex";
        item.style.justifyContent = "space-between";
        item.style.alignItems = "center";
        item.style.fontSize = "0.72rem";
        
        let dotColor = "#fbbf24";
        if (alloc.type === "bond") dotColor = "#10b981";
        else if (alloc.type === "eq") dotColor = "#3b82f6";
        else if (alloc.type === "globeq") dotColor = "#a855f7";

        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.35rem;">
                <span class="legend-dot" style="background: ${dotColor}; width: 6px; height: 6px; border-radius: 50%;"></span>
                <span style="color: var(--text-secondary);">${alloc.name}</span>
            </div>
            <span style="font-weight: 700; color: #f3f4f6;">${alloc.weight}%</span>
        `;
        allocContainer.appendChild(item);
    });

    // Render sub-funds lists
    const subfundsContainer = document.getElementById("policy-subfunds-list");
    subfundsContainer.innerHTML = "";
    policy.subFunds.forEach(fund => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span>${fund.name}</span>
            <span class="sub-fund-mgr">${fund.manager}</span>
        `;
        subfundsContainer.appendChild(li);
    });

    calculateEgatDca();
}

function calculateEgatDca() {
    const salary = parseFloat(document.getElementById("egat-salary").value) || 0;
    const employeeContribRate = parseFloat(document.getElementById("egat-contrib-rate").value) || 2;
    const dcaYears = parseInt(document.getElementById("egat-dca-years").value) || 15;
    
    // EGAT Employer Matching Rate logic
    const serviceYearsVal = parseInt(document.getElementById("egat-service-years").value);
    let employerMaxRate = 9; // < 5 years
    if (serviceYearsVal >= 5 && serviceYearsVal < 10) employerMaxRate = 11;
    else if (serviceYearsVal >= 10 && serviceYearsVal < 20) employerMaxRate = 13;
    else if (serviceYearsVal >= 20) employerMaxRate = 15;

    const actualMatchingRate = Math.min(employeeContribRate, employerMaxRate);
    
    const monthlyEmployeeSaving = salary * (employeeContribRate / 100);
    const monthlyEmployerSaving = salary * (actualMatchingRate / 100);
    const monthlyTotalSaving = monthlyEmployeeSaving + monthlyEmployerSaving;
    const totalMonths = dcaYears * 12;

    // Calculate for all 4 policies to populate the comparison table
    const allPoliciesResults = {};
    for (const policyKey in egatPvdPolicies) {
        const pol = egatPvdPolicies[policyKey];
        const mod = egatYieldModifier[policyKey] || 0;
        const rate = Math.max(0.5, pol.baseYield + mod);
        const mRate = (rate / 100) / 12;
        
        let bal = 0;
        for (let m = 1; m <= totalMonths; m++) {
            bal = (bal + monthlyTotalSaving) * (1 + mRate);
        }
        allPoliciesResults[policyKey] = Math.round(bal);
        
        // Update table projected cell
        const tableProjCell = document.getElementById(`table-proj-${policyKey}`);
        if (tableProjCell) {
            tableProjCell.innerText = `฿${Math.round(bal).toLocaleString()}`;
        }
        
        // Update table yield cell (if news modifies it, display the new value)
        const tableYieldCell = document.getElementById(`table-yield-${policyKey}`);
        if (tableYieldCell) {
            tableYieldCell.innerText = `~${(pol.baseYield + mod).toFixed(1)}%`;
        }
    }

    // Determine current active policy results for metrics
    const activePolicy = egatPvdPolicies[activeEgatPolicy];
    const activeMod = egatYieldModifier[activeEgatPolicy] || 0;
    const activeRate = Math.max(0.5, activePolicy.baseYield + activeMod);
    const activeMRate = (activeRate / 100) / 12;
    
    let currentBalance = 0;
    let totalEmployeeContrib = 0;
    let totalEmployerMatch = 0;

    const isCompareAll = document.getElementById("egat-chart-mode-checkbox").checked;
    const yearlyData = [];

    if (isCompareAll) {
        // Project values year-by-year for all 4 portfolios
        for (let y = 1; y <= dcaYears; y++) {
            const yearMonths = y * 12;
            const dataObj = { year: y };
            for (const policyKey in egatPvdPolicies) {
                const pol = egatPvdPolicies[policyKey];
                const mod = egatYieldModifier[policyKey] || 0;
                const rate = Math.max(0.5, pol.baseYield + mod);
                const mRate = (rate / 100) / 12;
                
                let bal = 0;
                for (let m = 1; m <= yearMonths; m++) {
                    bal = (bal + monthlyTotalSaving) * (1 + mRate);
                }
                dataObj[policyKey] = Math.round(bal);
            }
            // Also store active PVD employee/employer accumulations for labels
            dataObj.employeeAccum = Math.round(monthlyEmployeeSaving * yearMonths);
            dataObj.employerAccum = Math.round(monthlyEmployerSaving * yearMonths);
            yearlyData.push(dataObj);
        }
        // Use active policy calculations to populate metrics
        currentBalance = allPoliciesResults[activeEgatPolicy];
        totalEmployeeContrib = monthlyEmployeeSaving * totalMonths;
        totalEmployerMatch = monthlyEmployerSaving * totalMonths;
    } else {
        // Standard single policy calculations
        for (let month = 1; month <= totalMonths; month++) {
            currentBalance = (currentBalance + monthlyTotalSaving) * (1 + activeMRate);
            totalEmployeeContrib += monthlyEmployeeSaving;
            totalEmployerMatch += monthlyEmployerSaving;
            
            if (month % 12 === 0) {
                const yearIndex = month / 12;
                yearlyData.push({
                    year: yearIndex,
                    employeeAccum: Math.round(totalEmployeeContrib),
                    employerAccum: Math.round(totalEmployerMatch),
                    totalValue: Math.round(currentBalance)
                });
            }
        }
    }

    // Update UI Metrics
    document.getElementById("res-total-sum").innerText = `฿${Math.round(currentBalance).toLocaleString()}`;
    document.getElementById("res-employee-contrib").innerText = `฿${Math.round(totalEmployeeContrib).toLocaleString()}`;
    document.getElementById("res-employer-match").innerText = `฿${Math.round(totalEmployerMatch).toLocaleString()}`;
    
    const compoundYield = Math.max(0, currentBalance - (totalEmployeeContrib + totalEmployerMatch));
    document.getElementById("res-compound-yield").innerText = `฿${Math.round(compoundYield).toLocaleString()}`;

    // Update active percentage pill highlight
    document.querySelectorAll(".pct-pill").forEach(pill => {
        pill.classList.remove("active");
        if (pill.getAttribute("data-pct") === employeeContribRate.toString()) {
            pill.classList.add("active");
        }
    });

    // Update milestones check
    checkEgatMilestones(currentBalance);

    // Update advice panel with timeline steps
    document.getElementById("egat-pvd-advisory-text").innerHTML = generateEgatAdvisoryText(salary, employeeContribRate, actualMatchingRate, employerMaxRate, dcaYears);

    // Render Growth SVG Line Chart or Actual Returns
    if (activeEgatChartTab === "projection") {
        plotEgatGrowthChart(yearlyData);
    } else {
        drawEgatActualReturnsChart();
    }
}

// Check wealth milestones unlocked states
function checkEgatMilestones(balance) {
    const limits = [1000000, 5000000, 10000000, 20000000];
    const ids = ["ms-1", "ms-5", "ms-10", "ms-20"];
    
    ids.forEach((id, idx) => {
        const card = document.getElementById(id);
        if (card) {
            if (balance >= limits[idx]) {
                card.classList.remove("locked");
                card.classList.add("unlocked");
            } else {
                card.classList.remove("unlocked");
                card.classList.add("locked");
            }
        }
    });
}

// Generate customized financial advisory timeline steps
function generateEgatAdvisoryText(salary, contribRate, matchingRate, maxMatchingLimit, dcaYears) {
    let text = "";

    // Step 1: Employer Match
    const step1Class = contribRate < maxMatchingLimit ? "warning" : "success";
    const step1Title = contribRate < maxMatchingLimit ? "⚠️ เสียสิทธิ์สมทบของนายจ้าง" : "✅ ได้รับเงินสมทบจากนายจ้างสูงสุด";
    const step1Content = contribRate < maxMatchingLimit 
        ? `กฟผ. สมทบสูงสุดของอายุงานคุณที่ <strong>${maxMatchingLimit}%</strong> แต่คุณสะสม <strong>${contribRate}%</strong> สูญสิทธิ์สมทบฟรีไปถึงปีละ <strong>฿${Math.round(salary * (maxMatchingLimit - contribRate) / 100 * 12).toLocaleString()}</strong> แนะนำปรับขึ้นด่วนครับ!`
        : `คุณสะสมสะท้อนสิทธิ์สมทบสูงสุดของ กฟผ. ที่ <strong>${maxMatchingLimit}%</strong> เรียบร้อยแล้ว ได้รับเงินสนับสนุนครบเต็มเม็ดเต็มหน่วย <strong>฿${Math.round(salary * maxMatchingLimit / 100).toLocaleString()} ต่อเดือน</strong>`;
    
    text += `
    <div class="timeline-item ${step1Class}">
        <div class="timeline-marker"></div>
        <div class="timeline-content">
            <div class="timeline-title">${step1Title}</div>
            <div>${step1Content}</div>
        </div>
    </div>
    `;

    // Step 2: Lifecycle Timeline strategy
    let step2Class = "info";
    let step2Title = `💡 แผนการลงทุนที่แนะนำ (${dcaYears} ปี)`;
    let step2Content = "";
    
    if (dcaYears >= 15) {
        step2Content = `คุณมีระยะเวลาเก็บออมอีก <strong>${dcaYears} ปี</strong> ก่อนเกษียณ แนะนำจัดแผนลงทุนหุ้นต่างประเทศสูงอย่าง <strong style="color: #c084fc;">EGAT5 (เมกะเทรนด์ & ESG)</strong> หรือ <strong style="color: #fb923c;">EGAT4</strong> เพื่อกระตุ้นพลังดอกเบี้ยทบต้นระยะยาวสูงสุด`;
    } else if (dcaYears >= 5 && dcaYears < 15) {
        step2Content = `ระยะเวลาปานกลาง <strong>${dcaYears} ปี</strong> แนะนำเฉลี่ยสินทรัพย์ผสมผสานในกองทุน <strong style="color: #60a5fa;">EGAT2 (นโยบายผสมทางเลือก)</strong> เพื่อรักษาสมดุลความผันผวนของพอร์ตการเงินหลัก`;
    } else {
        step2Content = `ช่วงท้ายก่อนเกษียณใน <strong>${dcaYears} ปี</strong> แนะนำหันมาถือครองพอร์ตปลอดภัยสูงอย่าง <strong style="color: #34d399;">EGAT1 (นโยบายตราสารหนี้มั่นคง)</strong> ป้องกันเงินทุนสะสมเสียหายก่อนการปิดบัญชีออม`;
    }
    
    text += `
    <div class="timeline-item ${step2Class}">
        <div class="timeline-marker"></div>
        <div class="timeline-content">
            <div class="timeline-title">${step2Title}</div>
            <div>${step2Content}</div>
        </div>
    </div>
    `;

    // Step 3: Tax Benefit
    const annualContrib = salary * (contribRate / 100) * 12;
    text += `
    <div class="timeline-item info">
        <div class="timeline-marker"></div>
        <div class="timeline-content">
            <div class="timeline-title">💰 วิเคราะห์สิทธิ์ลดหย่อนภาษีรายปี</div>
            <div>ยอดสะสมพนักงานเข้า PVD ของคุณคิดเป็นปีละ <strong>฿${Math.round(annualContrib).toLocaleString()}</strong> สามารถนำไปคำนวณหักลดหย่อนภาษีเงินได้บุคคลธรรมดาประจำปีได้สูงสุดเต็มจำนวนทันที</div>
        </div>
    </div>
    `;

    return text;
}

function plotEgatGrowthChart(data) {
    const svg = document.getElementById("egat-growth-chart");
    if (!svg) return;

    // Viewport box width: 500, height: 240
    const w = 500;
    const h = 240;
    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 30;
    const paddingBottom = 40;
    
    const graphWidth = w - paddingLeft - paddingRight;
    const graphHeight = h - paddingTop - paddingBottom;
    
    // Clear old SVG elements
    svg.innerHTML = "";
    
    if (data.length === 0) return;
    
    const isCompareAll = document.getElementById("egat-chart-mode-checkbox").checked;
    
    // Calculate max Y value
    let maxVal = 100000;
    if (isCompareAll) {
        maxVal = Math.max(...data.map(d => Math.max(d.egat1 || 0, d.egat2 || 0, d.egat4 || 0, d.egat5 || 0))) * 1.05;
    } else {
        maxVal = Math.max(...data.map(d => d.totalValue || 0)) * 1.05;
    }
    if (maxVal < 100000) maxVal = 100000;

    const yearsCount = data.length;

    // Define X & Y scales
    const getX = (year) => paddingLeft + (year / yearsCount) * graphWidth;
    const getY = (val) => h - paddingBottom - (val / maxVal) * graphHeight;

    // Add Grid Lines & Y-Axis values
    const ticksCount = 4;
    for (let i = 0; i <= ticksCount; i++) {
        const val = (maxVal / ticksCount) * i;
        const y = getY(val);
        
        // Horizontal gridline
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", paddingLeft);
        line.setAttribute("y1", y);
        line.setAttribute("x2", w - paddingRight);
        line.setAttribute("y2", y);
        line.setAttribute("class", "chart-grid-line");
        svg.appendChild(line);
        
        // Y-axis label text
        const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
        txt.setAttribute("x", paddingLeft - 10);
        txt.setAttribute("y", y + 3);
        txt.setAttribute("text-anchor", "end");
        txt.setAttribute("class", "chart-label");
        txt.textContent = val >= 1000000 
            ? `${(val / 1000000).toFixed(1)}M` 
            : `${Math.round(val / 1000).toLocaleString()}k`;
        svg.appendChild(txt);
    }

    // Draw X-Axis Year Labels
    const yearTickInterval = Math.max(1, Math.round(yearsCount / 5));
    data.forEach((d) => {
        if (d.year % yearTickInterval === 0 || d.year === yearsCount) {
            const x = getX(d.year);
            const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
            txt.setAttribute("x", x);
            txt.setAttribute("y", h - paddingBottom + 16);
            txt.setAttribute("text-anchor", "middle");
            txt.setAttribute("class", "chart-label");
            txt.textContent = `ปีที่ ${d.year}`;
            svg.appendChild(txt);
        }
    });

    // Update Legend Box indicators depending on mode
    const legendBox = document.querySelector(".chart-legend-egat");
    if (legendBox) {
        if (isCompareAll) {
            legendBox.innerHTML = `
                <span><span class="legend-dot" style="background: #10b981;"></span>EGAT1 (ตราสารหนี้)</span>
                <span><span class="legend-dot" style="background: #3b82f6;"></span>EGAT2 (ผสม)</span>
                <span><span class="legend-dot" style="background: #f97316;"></span>EGAT4 (ต่างประเทศ)</span>
                <span><span class="legend-dot" style="background: #a855f7;"></span>EGAT5 (เมกะเทรนด์)</span>
            `;
        } else {
            legendBox.innerHTML = `
                <span><span class="legend-dot" style="background: #3b82f6;"></span>สะสมคุณ</span>
                <span><span class="legend-dot" style="background: #a855f7;"></span>สมทบ กฟผ.</span>
                <span><span class="legend-dot" style="background: #10b981;"></span>รวมสุทธิ (${activeEgatPolicy.toUpperCase()})</span>
            `;
        }
    }

    if (isCompareAll) {
        // Draw 4 paths representing the 4 portfolios
        const paths = {
            egat1: `M ${getX(0)} ${getY(0)}`,
            egat2: `M ${getX(0)} ${getY(0)}`,
            egat4: `M ${getX(0)} ${getY(0)}`,
            egat5: `M ${getX(0)} ${getY(0)}`
        };

        data.forEach(d => {
            const x = getX(d.year);
            paths.egat1 += ` L ${x} ${getY(d.egat1)}`;
            paths.egat2 += ` L ${x} ${getY(d.egat2)}`;
            paths.egat4 += ` L ${x} ${getY(d.egat4)}`;
            paths.egat5 += ` L ${x} ${getY(d.egat5)}`;
        });

        // 1. Render EGAT1 Line (Green)
        const line1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        line1.setAttribute("d", paths.egat1);
        line1.setAttribute("class", "chart-path");
        line1.setAttribute("stroke", "#10b981");
        line1.setAttribute("stroke-width", activeEgatPolicy === "egat1" ? "3.5" : "2");
        line1.setAttribute("opacity", activeEgatPolicy === "egat1" ? "1" : "0.5");
        svg.appendChild(line1);

        // 2. Render EGAT2 Line (Blue)
        const line2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        line2.setAttribute("d", paths.egat2);
        line2.setAttribute("class", "chart-path");
        line2.setAttribute("stroke", "#3b82f6");
        line2.setAttribute("stroke-width", activeEgatPolicy === "egat2" ? "3.5" : "2");
        line2.setAttribute("opacity", activeEgatPolicy === "egat2" ? "1" : "0.5");
        svg.appendChild(line2);

        // 3. Render EGAT4 Line (Orange)
        const line4 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        line4.setAttribute("d", paths.egat4);
        line4.setAttribute("class", "chart-path");
        line4.setAttribute("stroke", "#f97316");
        line4.setAttribute("stroke-width", activeEgatPolicy === "egat4" ? "3.5" : "2");
        line4.setAttribute("opacity", activeEgatPolicy === "egat4" ? "1" : "0.5");
        svg.appendChild(line4);

        // 4. Render EGAT5 Line (Purple)
        const line5 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        line5.setAttribute("d", paths.egat5);
        line5.setAttribute("class", "chart-path");
        line5.setAttribute("stroke", "#a855f7");
        line5.setAttribute("stroke-width", activeEgatPolicy === "egat5" ? "3.5" : "2");
        line5.setAttribute("opacity", activeEgatPolicy === "egat5" ? "1" : "0.5");
        svg.appendChild(line5);

    } else {
        // Draw standard 3 paths for single portfolio view
        let employeePoints = `M ${getX(0)} ${getY(0)}`;
        let employerPoints = `M ${getX(0)} ${getY(0)}`;
        let totalPoints = `M ${getX(0)} ${getY(0)}`;
        let areaTotalPoints = `M ${getX(0)} ${getY(0)}`;

        data.forEach(d => {
            const x = getX(d.year);
            employeePoints += ` L ${x} ${getY(d.employeeAccum)}`;
            employerPoints += ` L ${x} ${getY(d.employeeAccum + d.employerAccum)}`;
            totalPoints += ` L ${x} ${getY(d.totalValue)}`;
            areaTotalPoints += ` L ${x} ${getY(d.totalValue)}`;
        });
        
        const lastX = getX(yearsCount);
        areaTotalPoints += ` L ${lastX} ${getY(0)} Z`;

        // Shaded area under total value
        const totalAreaPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        totalAreaPath.setAttribute("d", areaTotalPoints);
        totalAreaPath.setAttribute("class", "chart-area");
        totalAreaPath.setAttribute("fill", "#10b981");
        svg.appendChild(totalAreaPath);

        // Employee accum line (Blue)
        const empLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
        empLine.setAttribute("d", employeePoints);
        empLine.setAttribute("class", "chart-path");
        empLine.setAttribute("stroke", "#3b82f6");
        empLine.setAttribute("stroke-width", "2");
        svg.appendChild(empLine);

        // Employer accum line (Purple)
        const employerLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
        employerLine.setAttribute("d", employerPoints);
        employerLine.setAttribute("class", "chart-path");
        employerLine.setAttribute("stroke", "#a855f7");
        employerLine.setAttribute("stroke-width", "2");
        svg.appendChild(employerLine);

        // Total Value line (Green)
        const totalLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
        totalLine.setAttribute("d", totalPoints);
        totalLine.setAttribute("class", "chart-path");
        totalLine.setAttribute("stroke", "#10b981");
        totalLine.setAttribute("stroke-width", "3.5");
        svg.appendChild(totalLine);
    }

    // Draw interactive hover nodes & vertical tracking guide line
    const trackingGuide = document.createElementNS("http://www.w3.org/2000/svg", "line");
    trackingGuide.setAttribute("y1", paddingTop);
    trackingGuide.setAttribute("y2", h - paddingBottom);
    trackingGuide.setAttribute("stroke", "rgba(255,255,255,0.2)");
    trackingGuide.setAttribute("stroke-dasharray", "3,3");
    trackingGuide.setAttribute("style", "display: none;");
    svg.appendChild(trackingGuide);

    const hoverDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    hoverDot.setAttribute("r", "5");
    hoverDot.setAttribute("fill", "#10b981");
    hoverDot.setAttribute("stroke", "#ffffff");
    hoverDot.setAttribute("stroke-width", "1.5");
    hoverDot.setAttribute("style", "display: none;");
    svg.appendChild(hoverDot);

    // Hover Interaction Handlers
    svg.addEventListener("mousemove", (e) => {
        const rect = svg.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        
        // Calculate closest year index based on SVG viewBox coordinates
        const svgMouseX = (mouseX / rect.width) * w;
        
        if (svgMouseX < paddingLeft || svgMouseX > w - paddingRight) {
            trackingGuide.setAttribute("style", "display: none;");
            hoverDot.setAttribute("style", "display: none;");
            document.getElementById("egat-chart-tooltip").classList.add("hidden");
            return;
        }

        const relativeX = svgMouseX - paddingLeft;
        const yearFraction = (relativeX / graphWidth) * yearsCount;
        const yearIndex = Math.max(1, Math.min(yearsCount, Math.round(yearFraction)));
        
        const d = data[yearIndex - 1];
        if (!d) return;

        const xPos = getX(d.year);
        
        // Dot follows active policy value
        let activeVal = d.totalValue;
        if (isCompareAll) {
            activeVal = d[activeEgatPolicy];
        }
        const yPos = getY(activeVal);

        // Update tracking guide lines coordinates
        trackingGuide.setAttribute("x1", xPos);
        trackingGuide.setAttribute("x2", xPos);
        trackingGuide.setAttribute("style", "display: block;");

        // Move dot
        hoverDot.setAttribute("cx", xPos);
        hoverDot.setAttribute("cy", yPos);
        
        // Style dot color according to active policy
        let dotColor = "#10b981";
        if (activeEgatPolicy === "egat2") dotColor = "#3b82f6";
        else if (activeEgatPolicy === "egat4") dotColor = "#f97316";
        else if (activeEgatPolicy === "egat5") dotColor = "#a855f7";
        hoverDot.setAttribute("fill", dotColor);
        hoverDot.setAttribute("style", "display: block;");

        // Position and fill Tooltip html
        const tooltip = document.getElementById("egat-chart-tooltip");
        if (isCompareAll) {
            tooltip.innerHTML = `
                <strong>ปีที่ ${d.year} (เปรียบเทียบ)</strong><br>
                <span style="color: #10b981;">● EGAT1: ฿${d.egat1.toLocaleString()}</span><br>
                <span style="color: #3b82f6;">● EGAT2: ฿${d.egat2.toLocaleString()}</span><br>
                <span style="color: #f97316;">● EGAT4: ฿${d.egat4.toLocaleString()}</span><br>
                <span style="color: #c084fc;">● EGAT5: ฿${d.egat5.toLocaleString()}</span>
            `;
        } else {
            tooltip.innerHTML = `
                <strong>ปีที่ ${d.year} (${activeEgatPolicy.toUpperCase()})</strong><br>
                สะสมคุณ: ฿${d.employeeAccum.toLocaleString()}<br>
                สมทบ กฟผ: ฿${(d.employeeAccum + d.employerAccum).toLocaleString()}<br>
                <span style="color: #34d399;">รวมสุทธิ: ฿${d.totalValue.toLocaleString()}</span>
            `;
        }
        tooltip.classList.remove("hidden");
        
        // Tooltip page positioning offset
        const tooltipWidth = tooltip.offsetWidth;
        const pageX = (xPos / w) * rect.width;
        const pageY = (yPos / h) * rect.height;
        
        tooltip.style.left = `${pageX}px`;
        tooltip.style.top = `${pageY}px`;
    });

    svg.addEventListener("mouseleave", () => {
        trackingGuide.setAttribute("style", "display: none;");
        hoverDot.setAttribute("style", "display: none;");
        document.getElementById("egat-chart-tooltip").classList.add("hidden");
    });
}


function renderEgatMacroEvents() {
    const list = document.getElementById("macro-events-list");
    if (!list) return;

    list.innerHTML = "";
    egatMacroEvents.forEach(evt => {
        const card = document.createElement("div");
        card.className = "macro-event-card";
        card.setAttribute("id", `macro-evt-${evt.id}`);
        card.innerHTML = `
            <span class="macro-event-emoji">${evt.emoji}</span>
            <h6>${evt.title}</h6>
        `;
        card.addEventListener("click", () => triggerEgatEvent(evt.id));
        list.appendChild(card);
    });
}

function triggerEgatEvent(eventId) {
    const evt = egatMacroEvents.find(e => e.id === eventId);
    if (!evt) return;

    activeEgatEvent = evt;
    
    // Highlight active card
    document.querySelectorAll(".macro-event-card").forEach(c => c.classList.remove("active"));
    const activeCard = document.getElementById(`macro-evt-${eventId}`);
    if (activeCard) activeCard.classList.add("active");

    // Display impact explanation
    document.getElementById("impact-event-title").innerText = `${evt.emoji} วิเคราะห์ข่าว: ${evt.title}`;
    document.getElementById("impact-explanation-text").innerText = evt.analysis;

    // Show rating badges for all PVD options
    const ratingsDisp = document.getElementById("impact-ratings-display");
    ratingsDisp.innerHTML = "";
    
    for (const key in evt.ratings) {
        const rating = evt.ratings[key];
        const span = document.createElement("span");
        
        let rateClass = "badge-neu";
        let ratingTxt = "เท่าเดิม";
        if (rating === "pos") { rateClass = "badge-pos"; ratingTxt = "ส่งผลบวก 📈"; }
        else if (rating === "neg") { rateClass = "badge-neg"; ratingTxt = "ส่งผลลบ 📉"; }
        
        const label = key.toUpperCase();
        span.className = `rating-badge ${rateClass}`;
        span.innerHTML = `<strong>${label}</strong>: ${ratingTxt}`;
        ratingsDisp.appendChild(span);
    }

    // Update sentiment gauge needle rotation & text label
    const needle = document.getElementById("sentiment-needle");
    const label = document.getElementById("sentiment-label");
    if (needle && label) {
        let rotation = 0;
        let lblText = "สภาวะปกติ (Neutral) ⚖️";
        
        if (eventId === "fed_cuts") {
            rotation = 50;
            lblText = "สภาวะเชิงบวกสูง (Bullish) 🚀";
            label.style.color = "#10b981";
        } else if (eventId === "china_stimulus") {
            rotation = 30;
            lblText = "สภาวะเชิงบวก (Optimistic) 📈";
            label.style.color = "#34d399";
        } else if (eventId === "inflation_spike") {
            rotation = -55;
            lblText = "วิกฤตความเสี่ยง (Risk-Off) ⚡";
            label.style.color = "#f87171";
        } else if (eventId === "baht_strong") {
            rotation = -20;
            lblText = "ค่าเงินตึงเครียด (FX Pressure) ⚖️";
            label.style.color = "#fbbf24";
        }
        
        needle.style.transform = `rotate(${rotation}deg)`;
        label.innerText = lblText;
    }

    // Hook action buttons
    document.getElementById("btn-apply-yield-mod").onclick = applyEgatEventModifiers;
    
    // Show the detail block
    document.getElementById("event-impact-detail").classList.remove("hidden");
}

function applyEgatEventModifiers() {
    if (!activeEgatEvent) return;
    
    // Apply modifiers to yield
    egatYieldModifier = { ...activeEgatEvent.yieldModifiers };
    
    // Highlight affected policy yields visually and update ticker tape values
    for (const policyKey in egatPvdPolicies) {
        const policy = egatPvdPolicies[policyKey];
        const card = document.querySelector(`.policy-select-card[data-policy="${policyKey}"]`);
        const modVal = egatYieldModifier[policyKey] || 0;
        const modText = modVal > 0 ? `+${modVal}` : modVal;
        
        if (card) {
            const yieldSpan = card.querySelector(".policy-yield");
            if (yieldSpan) {
                yieldSpan.innerHTML = `ผลตอบแทนปรับเปลี่ยน: <strong>฿${(policy.baseYield + modVal).toFixed(1)}%</strong> <span style="font-size:0.65rem; color:${modVal > 0 ? '#10b981' : '#ef4444'}">(${modText}%)</span>`;
            }
        }

        // Update all instances of this ticker element (since it's duplicated for marquee scroll)
        document.querySelectorAll(`#tick-val-${policyKey}`).forEach(priceEl => {
            const finalRate = policy.baseYield + modVal;
            priceEl.innerText = `฿${(10 + finalRate * 0.8).toFixed(2)}`;
        });
        document.querySelectorAll(`#tick-chg-${policyKey}`).forEach(chgEl => {
            chgEl.className = modVal >= 0 ? "ticker-change text-green" : "ticker-change text-red";
            chgEl.innerText = `${modVal >= 0 ? '▲' : '▼'} ${Math.abs(modVal).toFixed(1)}%`;
        });
    }

    calculateEgatDca();
    alert(`⚡ ปรับใช้สถานการณ์ "${activeEgatEvent.title}" เรียบร้อย! อัตราผลตอบแทนและกราฟ DCA ได้รับการจำลองผลแบบเรียลไทม์แล้วครับ`);
}

function resetEgatYieldMod() {
    egatYieldModifier = { egat1: 0, egat2: 0, egat4: 0, egat5: 0 };
    
    // Reset sentiment gauge needle rotation & text label
    const needle = document.getElementById("sentiment-needle");
    const label = document.getElementById("sentiment-label");
    if (needle && label) {
        needle.style.transform = `rotate(0deg)`;
        label.innerText = "สภาวะปกติ (Neutral) ⚖️";
        label.style.color = "#fbbf24";
    }

    // Restore policy card text and reset ticker tape
    for (const policyKey in egatPvdPolicies) {
        const policy = egatPvdPolicies[policyKey];
        const card = document.querySelector(`.policy-select-card[data-policy="${policyKey}"]`);
        if (card) {
            const yieldSpan = card.querySelector(".policy-yield");
            if (yieldSpan) {
                yieldSpan.innerHTML = `ผลตอบแทนเฉลี่ย: ~${policy.baseYield}% ต่อปี`;
            }
        }

        document.querySelectorAll(`#tick-val-${policyKey}`).forEach(priceEl => {
            priceEl.innerText = `฿${(10 + policy.baseYield * 0.8).toFixed(2)}`;
        });
        document.querySelectorAll(`#tick-chg-${policyKey}`).forEach(chgEl => {
            chgEl.className = "ticker-change text-green";
            chgEl.innerText = `▲ ${policy.baseYield.toFixed(1)}%`;
        });
    }

    calculateEgatDca();
}

function closeEgatEventImpact() {
    document.getElementById("event-impact-detail").classList.add("hidden");
    document.querySelectorAll(".macro-event-card").forEach(c => c.classList.remove("active"));
    activeEgatEvent = null;
    resetEgatYieldMod();
}

function drawEgatActualReturnsChart() {
    const svg = document.getElementById("egat-growth-chart");
    if (!svg) return;

    const w = 500;
    const h = 240;
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 30;
    const paddingBottom = 40;

    const graphWidth = w - paddingLeft - paddingRight;
    const graphHeight = h - paddingTop - paddingBottom;

    svg.innerHTML = "";

    // Actual returns data: Year 2567 & 2568
    const actualData = [
        { label: "EGAT1", y2567: 3.71, y2568: 4.18 },
        { label: "EGAT2", y2567: 1.42, y2568: -7.67 },
        { label: "EGAT4", y2567: 13.79, y2568: 9.02 },
        { label: "EGAT5", y2567: 14.47, y2568: 13.89 }
    ];

    const yMin = -10;
    const yMax = 16;

    // Coordinate converters
    const getX = (index) => paddingLeft + (index + 0.5) * (graphWidth / 4);
    const getY = (val) => paddingTop + graphHeight - ((val - yMin) / (yMax - yMin)) * graphHeight;

    const yZero = getY(0);

    // Draw Y axis ticks, labels, and horizontal gridlines
    const yTicks = [-10, -5, 0, 5, 10, 15];
    yTicks.forEach(tick => {
        const y = getY(tick);

        // Gridline
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", paddingLeft);
        line.setAttribute("y1", y);
        line.setAttribute("x2", w - paddingRight);
        line.setAttribute("y2", y);
        
        if (tick === 0) {
            line.setAttribute("style", "stroke: rgba(255, 255, 255, 0.4); stroke-width: 1.5;");
        } else {
            line.setAttribute("class", "chart-grid-line");
        }
        svg.appendChild(line);

        // Y label
        const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
        txt.setAttribute("x", paddingLeft - 10);
        txt.setAttribute("y", y + 4);
        txt.setAttribute("text-anchor", "end");
        txt.setAttribute("class", "chart-label");
        txt.textContent = `${tick}%`;
        svg.appendChild(txt);
    });

    const barWidth = 22;
    const barSpacing = 4;

    // Draw columns
    actualData.forEach((d, idx) => {
        const xCenter = getX(idx);

        // 1. Year 2567 Bar (Left)
        const x67 = xCenter - barWidth - barSpacing / 2;
        const y67 = getY(d.y2567);
        const h67 = Math.abs(yZero - y67);
        
        const rect67 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect67.setAttribute("x", x67);
        rect67.setAttribute("y", d.y2567 >= 0 ? y67 : yZero);
        rect67.setAttribute("width", barWidth);
        rect67.setAttribute("height", h67);
        rect67.setAttribute("rx", 3);
        rect67.setAttribute("fill", "url(#grad-actual-2567)");
        rect67.setAttribute("style", "cursor: pointer;");

        // Tooltip listeners
        rect67.addEventListener("mouseenter", (e) => showActualTooltip(e, `${d.label} ผลตอบแทนปี 2567: +${d.y2567}%`));
        rect67.addEventListener("mousemove", (e) => showActualTooltip(e, `${d.label} ผลตอบแทนปี 2567: +${d.y2567}%`));
        rect67.addEventListener("mouseleave", hideActualTooltip);
        svg.appendChild(rect67);

        // Label above/below the bar
        const txt67 = document.createElementNS("http://www.w3.org/2000/svg", "text");
        txt67.setAttribute("x", x67 + barWidth / 2);
        txt67.setAttribute("y", d.y2567 >= 0 ? y67 - 5 : yZero + h67 + 12);
        txt67.setAttribute("text-anchor", "middle");
        txt67.setAttribute("style", "font-size: 8px; fill: #60a5fa; font-weight: bold; pointer-events: none;");
        txt67.textContent = `+${d.y2567}%`;
        svg.appendChild(txt67);

        // 2. Year 2568 Bar (Right)
        const x68 = xCenter + barSpacing / 2;
        const y68 = getY(d.y2568);
        const h68 = Math.abs(yZero - y68);

        const rect68 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect68.setAttribute("x", x68);
        rect68.setAttribute("y", d.y2568 >= 0 ? y68 : yZero);
        rect68.setAttribute("width", barWidth);
        rect68.setAttribute("height", h68);
        rect68.setAttribute("rx", 3);
        rect68.setAttribute("fill", "url(#grad-actual-2568)");
        rect68.setAttribute("style", "cursor: pointer;");

        // Tooltip listeners
        rect68.addEventListener("mouseenter", (e) => showActualTooltip(e, `${d.label} ผลตอบแทนปี 2568: ${d.y2568 >= 0 ? '+' : ''}${d.y2568}%`));
        rect68.addEventListener("mousemove", (e) => showActualTooltip(e, `${d.label} ผลตอบแทนปี 2568: ${d.y2568 >= 0 ? '+' : ''}${d.y2568}%`));
        rect68.addEventListener("mouseleave", hideActualTooltip);
        svg.appendChild(rect68);

        // Label above/below the bar
        const txt68 = document.createElementNS("http://www.w3.org/2000/svg", "text");
        txt68.setAttribute("x", x68 + barWidth / 2);
        txt68.setAttribute("y", d.y2568 >= 0 ? y68 - 5 : yZero + h68 + 12);
        txt68.setAttribute("text-anchor", "middle");
        txt68.setAttribute("style", "font-size: 8px; fill: #c084fc; font-weight: bold; pointer-events: none;");
        txt68.textContent = `${d.y2568 >= 0 ? '+' : ''}${d.y2568}%`;
        svg.appendChild(txt68);

        // X Axis Label
        const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
        lbl.setAttribute("x", xCenter);
        lbl.setAttribute("y", h - paddingBottom + 20);
        lbl.setAttribute("text-anchor", "middle");
        lbl.setAttribute("class", "chart-label");
        lbl.setAttribute("style", "font-weight: bold; fill: var(--text-primary);");
        lbl.textContent = d.label;
        svg.appendChild(lbl);
    });

    // Create Defs & Gradients if not present
    let defs = svg.querySelector("defs");
    if (!defs) {
        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        svg.appendChild(defs);
    }

    // Gradient 2567
    const grad67 = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    grad67.setAttribute("id", "grad-actual-2567");
    grad67.setAttribute("x1", "0%");
    grad67.setAttribute("y1", "0%");
    grad67.setAttribute("x2", "0%");
    grad67.setAttribute("y2", "100%");
    grad67.innerHTML = `
        <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="#60a5fa" stop-opacity="0.25"/>
    `;
    defs.appendChild(grad67);

    // Gradient 2568
    const grad68 = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    grad68.setAttribute("id", "grad-actual-2568");
    grad68.setAttribute("x1", "0%");
    grad68.setAttribute("y1", "0%");
    grad68.setAttribute("x2", "0%");
    grad68.setAttribute("y2", "100%");
    grad68.innerHTML = `
        <stop offset="0%" stop-color="#a855f7" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="#c084fc" stop-opacity="0.25"/>
    `;
    defs.appendChild(grad68);
}

function showActualTooltip(e, text) {
    const tooltip = document.getElementById("egat-chart-tooltip");
    if (!tooltip) return;
    tooltip.innerHTML = text;
    tooltip.classList.remove("hidden");

    const cardRect = tooltip.parentElement.getBoundingClientRect();
    const x = e.clientX - cardRect.left + 15;
    const y = e.clientY - cardRect.top - 35;

    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
}

function hideActualTooltip() {
    const tooltip = document.getElementById("egat-chart-tooltip");
    if (tooltip) tooltip.classList.add("hidden");
}

// ==========================================
// DND RPG GAME ENGINE (BALDUR'S GATE 3 INSPIRED)
// ==========================================

// Game State
let dndPlayer = {
    name: "Tav",
    race: "human",
    class: "fighter",
    maxHp: 12,
    hp: 12,
    ac: 16,
    scores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
    mods: { str: -1, dex: -1, con: -1, int: -1, wis: -1, cha: -1 },
    inventory: [],
    spellSlotsMax: 0,
    spellSlots: 0,
    activeWeapon: "greatsword",
    level: 1
};
let dndCompanion = null; // Companion: e.g. { name: "Shadowheart", hp: 10, maxHp: 10, class: "cleric" }
let dndActiveEnemy = null; // Active Combat Enemy
let dndCurrentSceneId = "pod_room";
let dndPointPool = 27;
let dndIsInitialized = false;

// Weapons Database
const dndWeaponsDb = {
    greatsword: { name: "ดาบยักษ์ (Greatsword)", dice: "2d6", stat: "str", desc: "2d6 ฟันประชิด" },
    longbow: { name: "ธนูยาว (Longbow)", dice: "1d8", stat: "dex", desc: "1d8 โจมตีไกล" },
    dagger: { name: "มีดสั้น (Dagger)", dice: "1d4", stat: "dex", desc: "1d4 เจาะทะลวง" },
    staff: { name: "คทาเวทย์ (Magic Staff)", dice: "1d6", stat: "int", desc: "1d6 ทุบ + พลังเวทย์" },
    mace: { name: "กระบองเหล็ก (Mace)", dice: "1d6", stat: "str", desc: "1d6 ทุบกระแทก" },
    runeblade: { name: "ดาบรูน (Rune Blade)", dice: "2d8", stat: "str", desc: "2d8 ฟันเวทมนตร์" }
};

// Calculate and roll damage based on weapon configuration
function rollWeaponDamage(weaponKey) {
    const weapon = dndWeaponsDb[weaponKey] || dndWeaponsDb.dagger;
    const dice = weapon.dice;
    const parts = dice.split("d");
    const count = parseInt(parts[0]);
    const sides = parseInt(parts[1]);
    
    let total = 0;
    let rolls = [];
    for (let i = 0; i < count; i++) {
        const r = Math.floor(Math.random() * sides) + 1;
        rolls.push(r);
        total += r;
    }
    
    const modifier = dndPlayer.mods[weapon.stat] || 0;
    const grandTotal = Math.max(1, total + modifier);
    
    return {
        rolls: rolls,
        baseTotal: total,
        modifier: modifier,
        grandTotal: grandTotal,
        diceText: `${dice} (${rolls.join("+")})`
    };
}

// Scenarios / Adventure Steps Database
const dndAdventureStory = {
    pod_room: {
        title: "ยานบิน NAUTILOID: ห้องขังปรสิต",
        location: "Mind Flayer Ship - Pod Room",
        desc: "คุณลืมตาตื่นขึ้นมาด้วยอาการปวดหัวอย่างรุนแรง ในหัวของคุณรู้สึกถึงหนอนปรสิต (Tadpole) กำลังคืบคลานอยู่เบื้องหลังกระบอกตาคุณ รอบตัวคือแคปซูลแก้วอินทรีย์ของเอเลี่ยน Mind Flayer และมีร่างเหยื่อผู้เคราะห์ร้ายอีกรายติดอยู่ใน pod ใกล้ๆ ตัวเครื่องส่งเสียงสั่นสะเทือนเตือนความร้อนสูงของการชน คุณต้องหาทางออกไป!",
        options: [
            { text: "🔍 สำรวจรอบๆ ห้องและแผงอุปกรณ์", next: "explore_pod" },
            { text: "🖥️ [ARCANA] ตรวจสอบแผงสวิตช์ควบคุมปรสิตบนคอนโซลกลาง", check: { type: "INT", stat: "int", dc: 10, success: "console_success", fail: "console_fail" } },
            { text: "🛡️ [ATHLETICS] ใช้พละกำลังพยายามทุบพังแคปซูลของเหยื่อรายข้างๆ เพื่อช่วยเหลือ", check: { type: "STR", stat: "str", dc: 12, success: "save_shadowheart_success", fail: "save_shadowheart_fail" } },
            { text: "🚪 เปิดประตูบานใหญ่ออกไปสู่โถงทางเดินหลัก", next: "enter_hallway" }
        ]
    },
    explore_pod: {
        title: "ยานบิน NAUTILOID: สแกนห้อง",
        location: "Mind Flayer Ship - Pod Room",
        desc: "คุณเดินสำรวจแผงสิ่งมีชีวิตอินทรีย์ บนแท่นหินใกล้ๆ คุณพบดาบรูนเรืองแสงสีฟ้าอ่อนและขวดยาสีแดงใสที่มีพลังงานรักษาไหลเวียนอยู่",
        options: [
            { text: "🗡️ หยิบดาบรูนและยาฟื้นฟู (Loot Items)", action: (p) => {
                p.inventory.push("ดาบรูน (Rune Blade)", "ยาฟื้นฟู (Potion of Healing)");
                logGameMsg("หยิบ ดาบรูน (Rune Blade) และ ยาฟื้นฟู (Potion of Healing) เข้ากระเป๋าเรียบร้อย!", "system");
                updateDndHud();
            }, next: "pod_room" },
            { text: "🔙 กลับไปยังจุดศูนย์กลางห้อง", next: "pod_room" }
        ]
    },
    console_success: {
        title: "ยานบิน NAUTILOID: ปลดล็อคระบบ",
        location: "Mind Flayer Ship - Pod Room",
        desc: "ความรู้ด้านเวทมนตร์และโครงสร้างสิ่งมีชีวิตต่างดาวของคุณช่วยให้เข้าใจสัญญาณประสาท คอนโซลทำงาน แคปซูลของเหยื่อสาวเปิดออก! เธอคือ 'Shadowheart' นักบวชสาวผู้ถือสิ่งประดิษฐ์ทรงกลมลึกลับ เธอรีบออกมาและขอบคุณคุณพร้อมร่วมผจญภัยหนีไปด้วยกัน!",
        options: [
            { text: "🤝 พา Shadowheart ร่วมเดินทางและเตรียมออกทางเดินหลัก", action: (p) => {
                dndCompanion = { name: "Shadowheart", hp: 10, maxHp: 10, class: "cleric" };
                logGameMsg("Shadowheart เข้าร่วมทีมเป็นผู้ติดตามของคุณ!", "system");
                updateDndHud();
            }, next: "enter_hallway" }
        ]
    },
    console_fail: {
        title: "ยานบิน NAUTILOID: ระบบช็อต",
        location: "Mind Flayer Ship - Pod Room",
        desc: "คุณกดปุ่มผิดพลาด คอนโซลส่งกระแสไฟฟ้าแรงสูงย้อนกลับมาทำร้ายคุณ! แคปซูลข้างๆ เกิดควันดำท่วมหน้ากากล็อคสนิทกว่าเดิม และคุณได้รับความเสียหายชั่วคราว",
        options: [
            { text: "🤕 พยายามประคองตัวขึ้นมาและเลือกเส้นทางใหม่", action: (p) => {
                p.hp = Math.max(1, p.hp - 2);
                logGameMsg("คุณได้รับความเสียหาย 2 HP จากไฟช็อตของแผงคอนโซล!", "system-fail");
                updateDndHud();
            }, next: "pod_room" }
        ]
    },
    save_shadowheart_success: {
        title: "ยานบิน NAUTILOID: พลังนักรบ",
        location: "Mind Flayer Ship - Pod Room",
        desc: "คุณใช้แรงบีบกระแทกแก้วแกนกลางจนแตกร้าว บานพับอินทรีย์เปิดออก เผยร่างของ 'Shadowheart' ที่รีบคลานออกมารอบกอดดาบของเธอด้วยความโล่งใจ เธอขอบคุณในความกล้าหาญของคุณและพร้อมเป็นโล่ป้องกันภัยร่วมเดินทางไปข้างหน้า!",
        options: [
            { text: "🤝 ชวน Shadowheart เดินทางออกจากห้อง", action: (p) => {
                dndCompanion = { name: "Shadowheart", hp: 10, maxHp: 10, class: "cleric" };
                logGameMsg("Shadowheart เข้าร่วมทีมในฐานะ Cleric คอยสนับสนุน!", "system");
                updateDndHud();
            }, next: "enter_hallway" }
        ]
    },
    save_shadowheart_fail: {
        title: "ยานบิน NAUTILOID: ทุบพังไร้ผล",
        location: "Mind Flayer Ship - Pod Room",
        desc: "คุณพยายามออกแรงกระแทกเต็มที่ แต่ฝาครอบแคปซูลแกร่งเกินไป แขนของคุณชาและเหนื่อยล้าไปชั่วขณะโดยช่วยเธอไม่ได้",
        options: [
            { text: "🔙 ยอมแพ้แล้วมองหาตัวช่วยอื่นในห้อง", next: "pod_room" }
        ]
    },
    enter_hallway: {
        title: "ยานบิน NAUTILOID: โถงทางเดินหลัก",
        location: "Mind Flayer Ship - Hallway",
        desc: "เมื่อคุณก้าวเท้าเข้าสู่โถงทางเดินที่สร้างจากเนื้อเยื่อเอเลี่ยนสั่นไหว ทันใดนั้นมีร่างของปีศาจสมองเดินสี่ขา 'Intellect Devourer' กระโดดลงมาจากเพดานขวางทางคุณ! นัยน์ตาของมันไม่มี มีเพียงรอยหยักสมองที่สั่นกริ่ง มันขู่ฟ่อพร้อมเตรียมกระโจนเข้าจู่โจมคุณ!",
        options: [
            { text: "⚔️ เข้าสู่ระบบการต่อสู้! (Initiate Combat)", action: (p) => {
                triggerCombat("Intellect Devourer", 14, 11);
            } }
        ]
    },
    combat_victory: {
        title: "ยานบิน NAUTILOID: ชัยชนะแรก",
        location: "Mind Flayer Ship - Hallway",
        desc: "ร่างปีศาจสมองล้มลงชักกระตุกก่อนแน่นิ่งไป คุณสะบัดเลือดออกจากอาวุธและพบกองเศษวัสดุนายหน้าต่างดาว ในซากของมันมี 'ยาสมานแผลโบราณ (Elixir of Health)' ตกอยู่ ทางเดินขึ้นสู่ห้องควบคุมหลัก (Helm) เปิดออกแล้ว!",
        options: [
            { text: "🎒 ค้นตัวศัตรูและเตรียมตัวมุ่งหน้าสู่ห้องควบคุม", action: (p) => {
                p.inventory.push("ยาสมานแผลโบราณ (Elixir of Health)");
                logGameMsg("ได้รับ ยาสมานแผลโบราณ เข้าคลังเก็บของ!", "system");
                updateDndHud();
            }, next: "helm_escape" }
        ]
    },
    helm_escape: {
        title: "ยานบิน NAUTILOID: ห้องควบคุมคอนเนคเตอร์",
        location: "Mind Flayer Ship - The Helm",
        desc: "คุณก้าวเข้ามาในห้องบังคับการ (The Helm) ทั่วทั้งห้องกำลังตกอยู่ในสงคราม! ปีศาจไฟ Cambion กำลังปะทะกับ Mind Flayer ยักษ์ เสียงระเบิดและเปลวไฟแลบแดงฉาน ทรานสปอนเดอร์ (Transponder) สีม่วงสำหรับวาร์ปยานเชื่อมต่ออยู่ปลายสุดของสะพานเดิน คุณต้องฝ่าไปกดสวิตช์ก่อนยานจะระเบิด!",
        options: [
            { text: "🏃 [ATHLETICS] พุ่งตัวปีนข้ามซากปรักหักพังตรงไปยังปุ่มกด", check: { type: "STR", stat: "str", dc: 11, success: "escape_win", fail: "escape_fail" } },
            { text: "🏹 [STEALTH] แอบย่องเลี่ยงการสังเกตของปีศาจไฟผ่านมุมมืด", check: { type: "DEX", stat: "dex", dc: 13, success: "escape_win", fail: "escape_fail" } },
            { text: "🔮 [ARCANA] ปล่อยคลื่นพลังดึงดูดปุ่มกดจากระยะไกล (สำหรับจอมเวทย์)", check: { type: "INT", stat: "int", dc: 12, success: "escape_win", fail: "escape_fail" } }
        ]
    },
    escape_win: {
        title: "FAERÛN: หาดทรายระทม",
        location: "Ravaged Beach",
        desc: "คุณคว้าสายเชื่อมประสาททรานสปอนเดอร์ได้ทันเวลาและเสียบเข้าสมองควบคุมกลาง! ยานเกิดแสงสว่างวาร์ปข้ามมิติหักพังตกลงมาจากฟ้า และกระแทกเข้ากับชายฝั่งแม่น้ำ Chionthar... คุณตื่นขึ้นมาบนหาดทรายขาวละเอียด แสงแดดส่องสว่าง มีเสียงนกร้อง หนอนปรสิตในหัวคุณสงบลงชั่วคราว คุณรอดชีวิตจากขุมนรกได้แล้ว! ยินดีด้วยคุณผ่านเนื้อเรื่องช่วงแรกของ Baldur's Gate 3!",
        options: [
            { text: "🎉 จบการเดินทางช่วงทดสอบ (เริ่มสร้างตัวละครใหม่)", action: (p) => {
                logGameMsg("จบเกมแล้ว! คุณผ่านการผจญภัยช่วงเริ่มต้นและรอดชีวิตสู่ Faerûn ได้สำเร็จ!", "system");
            }, next: "character_reset" }
        ]
    },
    escape_fail: {
        title: "ยานบิน NAUTILOID: โดนไฟคลอก",
        location: "Mind Flayer Ship - The Helm",
        desc: "คุณเสียหลักก้าวพลาดจากแรงระเบิด ปีศาจหันมาปล่อยลูกไฟใส่คุณเต็มอก! เสื้อผ้าลุกไหม้และร่างของคุณกระเด็นตกสะพาน",
        options: [
            { text: "🔥 รักษาสมาธิและพยายามฝืนกด Transponder ให้ได้อีกครั้ง", action: (p) => {
                p.hp = Math.max(1, p.hp - 5);
                logGameMsg("คุณถูกเปลวไฟคลอก ได้รับความเสียหาย 5 HP!", "system-fail");
                updateDndHud();
            }, next: "helm_escape" }
        ]
    }
};

// Initial Setup
function initDndEngine() {
    if (dndIsInitialized) return;
    dndIsInitialized = true;
    
    // Bind Point buy increment buttons
    document.querySelectorAll(".dnd-btn-adjust").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const stat = e.currentTarget.getAttribute("data-stat");
            const isPlus = e.currentTarget.classList.contains("plus");
            adjustStatPointBuy(stat, isPlus);
        });
    });

    // Bind Race Selection Pills
    document.querySelectorAll(".dnd-race-select-grid .dnd-select-pill").forEach(pill => {
        pill.addEventListener("click", (e) => {
            document.querySelectorAll(".dnd-race-select-grid .dnd-select-pill").forEach(p => p.classList.remove("active"));
            e.currentTarget.classList.add("active");
            dndPlayer.race = e.currentTarget.getAttribute("data-race");
        });
    });

    // Bind Class Selection Pills
    document.querySelectorAll(".dnd-class-select-grid .dnd-class-pill").forEach(pill => {
        pill.addEventListener("click", (e) => {
            document.querySelectorAll(".dnd-class-select-grid .dnd-class-pill").forEach(p => p.classList.remove("active"));
            e.currentTarget.classList.add("active");
            dndPlayer.class = e.currentTarget.getAttribute("data-class");
        });
    });

    // Bind Start Button
    document.getElementById("dnd-start-btn").addEventListener("click", startDndGame);

    // Bind Custom Action Input Button
    document.getElementById("dnd-custom-action-btn").addEventListener("click", submitCustomDndAction);
    document.getElementById("dnd-custom-action-input").addEventListener("keypress", (e) => {
        if (e.key === "Enter") submitCustomDndAction();
    });

    // Dice overlay rolling triggers
    document.getElementById("dnd-roll-btn").addEventListener("click", executeD20DiceRoll);

    // Bind Weapon Selector Dropdown
    const weaponSelect = document.getElementById("dnd-weapon-select");
    if (weaponSelect) {
        weaponSelect.addEventListener("change", (e) => {
            dndPlayer.activeWeapon = e.target.value;
            const w = dndWeaponsDb[dndPlayer.activeWeapon];
            if (w) {
                logGameMsg(`คุณสวมใส่อาวุธ: **${w.name}** (${w.desc})`, "system");
            }
        });
    }

    // Initial character score UI refresh
    refreshPointBuyUi();
}

// Adjust Point-Buy Ability Scores
function adjustStatPointBuy(stat, isPlus) {
    let currentScore = dndPlayer.scores[stat];
    
    if (isPlus) {
        if (dndPointPool > 0 && currentScore < 15) {
            dndPlayer.scores[stat]++;
            dndPointPool--;
        }
    } else {
        if (currentScore > 8) {
            dndPlayer.scores[stat]--;
            dndPointPool++;
        }
    }
    refreshPointBuyUi();
}

// Refresh point allocation visual scores
function refreshPointBuyUi() {
    document.getElementById("dnd-pointbuy-pool").innerText = `แต้มคงเหลือ: ${dndPointPool}`;
    
    for (const stat in dndPlayer.scores) {
        const val = dndPlayer.scores[stat];
        const modifier = Math.floor((val - 10) / 2);
        
        document.getElementById(`val-${stat}`).innerText = val;
        
        const modSign = modifier >= 0 ? `+${modifier}` : modifier;
        const modEl = document.getElementById(`mod-${stat}`);
        modEl.innerText = modSign;
        modEl.style.color = modifier >= 0 ? "#10b981" : "#ef4444";
        
        // Save values in main player state
        dndPlayer.mods[stat] = modifier;
    }
}

// Start Adventure Game Sequence
function startDndGame() {
    const nameInput = document.getElementById("dnd-char-name").value.trim();
    dndPlayer.name = nameInput || "Tav";
    
    // Apply Race Attributes Bonuses
    if (dndPlayer.race === "human") {
        for (const stat in dndPlayer.scores) dndPlayer.scores[stat] += 1;
    } else if (dndPlayer.race === "elf") {
        dndPlayer.scores.dex += 2;
        dndPlayer.scores.int += 1;
    } else if (dndPlayer.race === "dwarf") {
        dndPlayer.scores.con += 2;
        dndPlayer.scores.str += 1;
    } else if (dndPlayer.race === "tiefling") {
        dndPlayer.scores.cha += 2;
        dndPlayer.scores.int += 1;
    } else if (dndPlayer.race === "githyanki") {
        dndPlayer.scores.str += 2;
        dndPlayer.scores.int += 1;
    }

    // Recompute Mods after Race selection
    for (const stat in dndPlayer.scores) {
        dndPlayer.mods[stat] = Math.floor((dndPlayer.scores[stat] - 10) / 2);
    }

    // Adjust Initial HP & AC based on class selections
    if (dndPlayer.class === "fighter") {
        dndPlayer.maxHp = 12 + dndPlayer.mods.con;
        dndPlayer.ac = 16;
    } else if (dndPlayer.class === "wizard") {
        dndPlayer.maxHp = 6 + dndPlayer.mods.con;
        dndPlayer.ac = 12 + dndPlayer.mods.dex;
        dndPlayer.spellSlotsMax = 2;
        dndPlayer.spellSlots = 2;
    } else if (dndPlayer.class === "rogue") {
        dndPlayer.maxHp = 8 + dndPlayer.mods.con;
        dndPlayer.ac = 14 + dndPlayer.mods.dex;
    } else if (dndPlayer.class === "cleric") {
        dndPlayer.maxHp = 10 + dndPlayer.mods.con;
        dndPlayer.ac = 15;
        dndPlayer.spellSlotsMax = 2;
        dndPlayer.spellSlots = 2;
    }

    dndPlayer.hp = dndPlayer.maxHp;
    dndPlayer.inventory = ["เสบียงยังชีพ (Rations)", "ตะเกียงเวทย์ (Torch)"];

    // Set Class-specific Weapons
    if (dndPlayer.class === "fighter") {
        dndPlayer.inventory.push("ดาบยักษ์ (Greatsword)", "ธนูยาว (Longbow)");
        dndPlayer.activeWeapon = "greatsword";
    } else if (dndPlayer.class === "wizard") {
        dndPlayer.inventory.push("คทาเวทย์ (Magic Staff)", "มีดสั้น (Dagger)");
        dndPlayer.activeWeapon = "staff";
    } else if (dndPlayer.class === "rogue") {
        dndPlayer.inventory.push("มีดสั้น (Dagger)", "ธนูยาว (Longbow)");
        dndPlayer.activeWeapon = "dagger";
    } else if (dndPlayer.class === "cleric") {
        dndPlayer.inventory.push("กระบองเหล็ก (Mace)", "ธนูยาว (Longbow)");
        dndPlayer.activeWeapon = "mace";
    }

    // Transition Creator to gameplay panel
    document.getElementById("dnd-char-creator").classList.add("hidden");
    document.getElementById("dnd-game-panel").classList.remove("hidden");

    // Init HUD
    updateDndHud();
    
    // Clear Narrative log
    const log = document.getElementById("dnd-log");
    log.innerHTML = "";
    
    // Load first room scene
    dndCurrentSceneId = "pod_room";
    loadDndScene(dndCurrentSceneId);
}

// Update character status HUD visual
function updateDndHud() {
    document.getElementById("hud-char-name").innerText = dndPlayer.name;
    document.getElementById("dnd-char-avatar").innerText = dndPlayer.name.substring(0, 2);
    document.getElementById("hud-char-meta").innerText = `ระดับ ${dndPlayer.level} ${dndPlayer.race.toUpperCase()} ${dndPlayer.class.toUpperCase()}`;
    
    document.getElementById("hud-char-hp-txt").innerText = `${dndPlayer.hp} / ${dndPlayer.maxHp}`;
    
    const pct = (dndPlayer.hp / dndPlayer.maxHp) * 100;
    const hpBar = document.getElementById("hud-char-hp-bar");
    hpBar.style.width = `${pct}%`;
    
    // Low HP Warning Flash effect
    const sidebarCard = hpBar.closest(".egat-card");
    if (pct <= 30) {
        sidebarCard.classList.add("hp-critical");
    } else {
        sidebarCard.classList.remove("hp-critical");
    }

    // Refresh Scores HUD
    for (const stat in dndPlayer.scores) {
        const val = dndPlayer.scores[stat];
        const modifier = dndPlayer.mods[stat];
        const sign = modifier >= 0 ? `+${modifier}` : modifier;
        document.getElementById(`hud-val-${stat}`).innerText = `${val} (${sign})`;
    }

    document.getElementById("hud-char-ac").innerText = dndPlayer.ac;

    // Show Spell slots if applicable
    const spellSlotsBox = document.getElementById("hud-spellslots-container");
    if (dndPlayer.spellSlotsMax > 0) {
        spellSlotsBox.classList.remove("hidden");
        const starsEl = document.getElementById("hud-spellslots-stars");
        starsEl.innerHTML = "";
        for (let i = 0; i < dndPlayer.spellSlotsMax; i++) {
            const star = document.createElement("span");
            star.innerText = i < dndPlayer.spellSlots ? "🔮" : "⚫";
            starsEl.appendChild(star);
        }
    } else {
        spellSlotsBox.classList.add("hidden");
    }

    // Load inventory grids
    const invGrid = document.getElementById("hud-inventory");
    invGrid.innerHTML = "";
    const itemsCount = Math.max(8, dndPlayer.inventory.length);
    
    for (let i = 0; i < itemsCount; i++) {
        const item = dndPlayer.inventory[i];
        const slot = document.createElement("div");
        slot.className = "inv-slot";
        slot.setAttribute("style", "aspect-ratio: 1; border-radius: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; font-size: 1.1rem;");
        
        if (item) {
            slot.classList.add("filled");
            // Set simple matching icons
            let emoji = "📦";
            if (item.includes("ดาบ")) emoji = "🗡️";
            else if (item.includes("ยา")) emoji = "🧪";
            else if (item.includes("ขวาน")) emoji = "🪓";
            else if (item.includes("หนังสือ")) emoji = "📜";
            
            slot.innerText = emoji;
            slot.title = item;
            
            // Allow double click to use items
            slot.addEventListener("click", () => {
                if (item.includes("ยาฟื้นฟู") || item.includes("ยาสมานแผล")) {
                    useDndHealingPotion(item);
                }
            });
        }
        invGrid.appendChild(slot);
    }

    // Populate weapon select element based on inventory contents
    const select = document.getElementById("dnd-weapon-select");
    if (select) {
        const previousValue = select.value || dndPlayer.activeWeapon;
        select.innerHTML = "";
        
        let addedCount = 0;
        for (const key in dndWeaponsDb) {
            const wInfo = dndWeaponsDb[key];
            // Split name to search for word matching e.g. "ดาบยักษ์" or "ธนูยาว" or "คทาเวทย์"
            const searchWord = wInfo.name.split(" ")[0];
            const hasIt = dndPlayer.inventory.some(item => item.includes(searchWord));
            if (hasIt) {
                const opt = document.createElement("option");
                opt.value = key;
                opt.text = `${wInfo.name} (${wInfo.desc})`;
                select.appendChild(opt);
                addedCount++;
            }
        }
        
        if (addedCount > 0) {
            // Re-select prior active weapon if still present
            const hasPrev = Array.from(select.options).some(o => o.value === previousValue);
            if (hasPrev) {
                select.value = previousValue;
                dndPlayer.activeWeapon = previousValue;
            } else {
                select.selectedIndex = 0;
                dndPlayer.activeWeapon = select.value;
            }
        }
    }

    // Companion status card card visibility
    const compCard = document.getElementById("dnd-companion-card");
    if (compCard) {
        if (dndCompanion) {
            compCard.classList.remove("hidden");
            document.getElementById("hud-comp-hp-txt").innerText = `${dndCompanion.hp} / ${dndCompanion.maxHp}`;
            const compPct = (dndCompanion.hp / dndCompanion.maxHp) * 100;
            document.getElementById("hud-comp-hp-bar").style.width = `${compPct}%`;
        } else {
            compCard.classList.add("hidden");
        }
    }
}

// Drink healing potion
function useDndHealingPotion(itemName) {
    if (dndPlayer.hp >= dndPlayer.maxHp) {
        logGameMsg("พลังชีวิตของคุณเต็มอยู่แล้ว ไม่จำเป็นต้องทานยานี้!", "system");
        return;
    }
    
    const idx = dndPlayer.inventory.indexOf(itemName);
    if (idx > -1) {
        dndPlayer.inventory.splice(idx, 1);
        const heal = Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 4; // 2d6+4
        dndPlayer.hp = Math.min(dndPlayer.maxHp, dndPlayer.hp + heal);
        logGameMsg(`🧪 ดื่ม ${itemName} ฟื้นฟูพลังชีวิตได้รับ +${heal} HP!`, "system");
        updateDndHud();
        
        // If combat is active, trigger enemy turn
        if (dndActiveEnemy) {
            setTimeout(enemyCombatTurn, 1000);
        }
    }
}

// Log game master dialogue messages
function logGameMsg(text, type = "gm") {
    const log = document.getElementById("dnd-log");
    if (!log) return;

    const entry = document.createElement("div");
    entry.className = `dnd-msg ${type}`;
    
    if (type === "player") {
        entry.innerHTML = `<span><strong>🗣️ ${dndPlayer.name}:</strong> ${text}</span>`;
    } else if (type === "system") {
        entry.innerHTML = `<span><strong>🎲 SYSTEM:</strong> ${text}</span>`;
    } else if (type === "system-fail") {
        entry.innerHTML = `<span><strong>💀 SYSTEM:</strong> ${text}</span>`;
    } else {
        entry.innerHTML = `<span><strong>📖 Game Master:</strong> ${text}</span>`;
    }

    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

// Load narrative step scene
function loadDndScene(sceneId) {
    if (sceneId === "character_reset") {
        // Soft reset character creator
        dndPointPool = 27;
        dndPlayer.scores = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
        dndCompanion = null;
        dndActiveEnemy = null;
        refreshPointBuyUi();
        document.getElementById("dnd-game-panel").classList.add("hidden");
        document.getElementById("dnd-char-creator").classList.remove("hidden");
        return;
    }

    dndCurrentSceneId = sceneId;
    const scene = dndAdventureStory[sceneId];
    if (!scene) return;

    document.getElementById("dnd-scene-title").innerText = scene.title;
    document.getElementById("dnd-scene-location").innerText = scene.location;
    
    // Change Scene Art based on location or story state
    const artImg = document.getElementById("dnd-scene-art-img");
    if (artImg) {
        if (sceneId === "escape_win") {
            artImg.src = "dnd_hero.jpg"; // Shows hero celebrating
        } else {
            artImg.src = "dnd_nautiloid.jpg"; // Organic spaceship interior
        }
    }

    // Narrate scene
    logGameMsg(scene.desc, "gm");

    // Populate options
    const optionsContainer = document.getElementById("dnd-options");
    optionsContainer.innerHTML = "";

    scene.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "dnd-choice-btn";
        btn.innerText = opt.text;
        
        btn.addEventListener("click", () => {
            // Apply choice side-effect action if present
            if (opt.action) opt.action(dndPlayer);

            if (opt.check) {
                // Trigger Dice Roll Check screen
                triggerD20Check(opt.text, opt.check);
            } else if (opt.next) {
                loadDndScene(opt.next);
            }
        });
        optionsContainer.appendChild(btn);
    });
}

// Active Dice Roll Configurations
let activeDndCheck = null;

// Trigger dice roll overlay modal
function triggerD20Check(actionTitle, checkConfig) {
    activeDndCheck = checkConfig;
    
    const overlay = document.getElementById("dnd-dice-overlay");
    const titleEl = document.getElementById("dnd-check-title");
    const dcEl = document.getElementById("dnd-check-dc");
    const modLabel = document.getElementById("dnd-roll-mod-label");
    const modVal = document.getElementById("dnd-roll-mod-val");

    titleEl.innerText = actionTitle.toUpperCase();
    dcEl.innerText = `ความยากเป้าหมาย (Target DC): ${checkConfig.dc}`;

    const statName = checkConfig.stat;
    const modifier = dndPlayer.mods[statName] || 0;
    
    modLabel.innerText = `โบนัสทักษะ [${checkConfig.type} Modifier]:`;
    modVal.innerText = modifier >= 0 ? `+${modifier}` : modifier;
    modVal.style.color = modifier >= 0 ? "#10b981" : "#ef4444";

    // Reset fields
    document.getElementById("dnd-roll-base").innerText = "-";
    document.getElementById("dnd-roll-total").innerText = "-";
    document.getElementById("dnd-d20-number").innerText = "20";
    document.getElementById("dnd-dice-result-panel").classList.add("hidden");
    
    const rollBtn = document.getElementById("dnd-roll-btn");
    rollBtn.disabled = false;
    rollBtn.style.opacity = "1";

    // Show Overlay
    overlay.classList.remove("hidden");
}

// Spin and roll dice sequence
function executeD20DiceRoll() {
    const rollBtn = document.getElementById("dnd-roll-btn");
    rollBtn.disabled = true;
    rollBtn.style.opacity = "0.5";

    const svg = document.getElementById("dnd-d20-svg");
    svg.classList.add("dice-rolling");

    const numberEl = document.getElementById("dnd-d20-number");
    
    // Flashing numbers animation
    let cycles = 0;
    const interval = setInterval(() => {
        numberEl.innerText = Math.floor(Math.random() * 20) + 1;
        cycles++;
        if (cycles > 16) {
            clearInterval(interval);
            finishDiceRoll();
        }
    }, 60);
}

// Complete the D20 roll calculations
function finishDiceRoll() {
    const svg = document.getElementById("dnd-d20-svg");
    svg.classList.remove("dice-rolling");

    const baseRoll = Math.floor(Math.random() * 20) + 1;
    const numberEl = document.getElementById("dnd-d20-number");
    numberEl.innerText = baseRoll;

    const modifier = dndPlayer.mods[activeDndCheck.stat] || 0;
    const total = baseRoll + modifier;

    document.getElementById("dnd-roll-base").innerText = baseRoll;
    document.getElementById("dnd-roll-total").innerText = total;

    const resultPanel = document.getElementById("dnd-dice-result-panel");
    resultPanel.classList.remove("hidden");

    const success = (total >= activeDndCheck.dc) || (baseRoll === 20); // 20 is Natural Critical Success!
    
    if (success) {
        resultPanel.innerText = baseRoll === 20 ? "🔥 CRITICAL SUCCESS 🎉" : "✨ SUCCESS (ความสำเร็จ) 🎉";
        resultPanel.style.background = "rgba(16, 185, 129, 0.9)";
        resultPanel.style.border = "1.5px solid #10b981";
        resultPanel.style.color = "#fff";
        
        setTimeout(() => {
            document.getElementById("dnd-dice-overlay").classList.add("hidden");
            if (typeof activeDndCheck.success === "function") {
                activeDndCheck.success();
            } else {
                loadDndScene(activeDndCheck.success);
            }
        }, 2200);
    } else {
        resultPanel.innerText = baseRoll === 1 ? "💀 CRITICAL FAILURE 💀" : "❌ FAILURE (ล้มเหลว) 💀";
        resultPanel.style.background = "rgba(239, 68, 68, 0.9)";
        resultPanel.style.border = "1.5px solid #ef4444";
        resultPanel.style.color = "#fff";
        
        // Shake screen on failure
        document.getElementById("dnd-dice-card").classList.add("shake-panel");
        setTimeout(() => {
            document.getElementById("dnd-dice-card").classList.remove("shake-panel");
        }, 500);

        setTimeout(() => {
            document.getElementById("dnd-dice-overlay").classList.add("hidden");
            if (typeof activeDndCheck.fail === "function") {
                activeDndCheck.fail();
            } else {
                loadDndScene(activeDndCheck.fail);
            }
        }, 2200);
    }
}

// Free Action Submit Parser
function submitCustomDndAction() {
    const inputEl = document.getElementById("dnd-custom-action-input");
    const actText = inputEl.value.trim();
    if (!actText) return;

    inputEl.value = "";
    
    // Log player action
    logGameMsg(actText, "player");

    // Process action keywords
    const lower = actText.toLowerCase();
    
    // 1. Attack Actions
    if (lower.includes("ฟัน") || lower.includes("ตี") || lower.includes("โจมตี") || lower.includes("ฆ่า") || lower.includes("attack") || lower.includes("fight")) {
        if (dndActiveEnemy) {
            executePlayerAttack();
        } else {
            logGameMsg("ไม่มีศัตรูในบริเวณนี้ให้คุณโจมตี! คุณฟันดาบใส่อากาศอย่างว่างเปล่า", "gm");
        }
        return;
    }
    
    // 2. Heal / Drink Action
    if (lower.includes("กินยา") || lower.includes("รักษา") || lower.includes("ฮีล") || lower.includes("ดื่มยา") || lower.includes("heal") || lower.includes("potion") || lower.includes("use potion")) {
        const potionName = dndPlayer.inventory.find(i => i.includes("ยา"));
        if (potionName) {
            useDndHealingPotion(potionName);
        } else {
            logGameMsg("คุณไม่มีขวดยาเหลือในสัมภาระ!", "gm");
        }
        return;
    }

    // 3. Search / Loot
    if (lower.includes("เก็บ") || lower.includes("ค้น") || lower.includes("สำรวจ") || lower.includes("หยิบ") || lower.includes("search") || lower.includes("loot") || lower.includes("take")) {
        if (dndCurrentSceneId === "pod_room") {
            loadDndScene("explore_pod");
        } else {
            logGameMsg("คุณมองไปรอบๆ ค้นหาตอกซอกซอยแต่ไม่พบสิ่งใดที่หยิบจับได้เพิ่มเติมในขณะนี้", "gm");
        }
        return;
    }

    // 4. Fallback Universal D20 custom roll check
    const randomDC = Math.floor(Math.random() * 5) + 10; // Random DC between 10 and 14
    const stats = ["str", "dex", "int", "wis", "cha"];
    const randStat = stats[Math.floor(Math.random() * stats.length)];
    const types = { str: "STR", dex: "DEX", int: "INT", wis: "WIS", cha: "CHA" };

    logGameMsg(`GM ทำการตรวจสอบเจตจำนงในการกระทำของคุณ... [ต้องทอยเต๋าตัดสิน DC ${randomDC}]`, "gm");

    setTimeout(() => {
        triggerD20Check(actText, {
            type: types[randStat],
            stat: randStat,
            dc: randomDC,
            success: dndCurrentSceneId, // Returns to current scene but adds positive outcome
            fail: dndCurrentSceneId
        });
        
        // Override callbacks once for custom narrative resolution
        activeDndCheck.success = () => {
            logGameMsg(`🎉 คุณทำการกระทำ "${actText}" สำเร็จลุล่วงอย่างงดงามตามความประสงค์!`, "system");
            if (dndActiveEnemy) {
                // If in combat, enemy takes minor damage from cool action
                const dmg = Math.floor(Math.random() * 4) + 2;
                dndActiveEnemy.hp = Math.max(0, dndActiveEnemy.hp - dmg);
                logGameMsg(`ศัตรูประหลาดใจ เสียหลักได้รับความเสียหาย ${dmg} HP จากการกระทำคาดไม่ถึงของคุณ!`, "gm");
                updateCombatStatus();
            }
            loadDndScene(dndCurrentSceneId);
        };
        activeDndCheck.fail = () => {
            logGameMsg(`💀 การกระทำ "${actText}" ล้มเหลว! คุณเสียจังหวะเกือบสะดุดล้มลงกองกับพื้น`, "system-fail");
            dndPlayer.hp = Math.max(1, dndPlayer.hp - 1);
            updateDndHud();
            loadDndScene(dndCurrentSceneId);
        };
    }, 800);
}

// Initiate turn-based combat encounter
function triggerCombat(enemyName, maxHp, ac) {
    dndActiveEnemy = { name: enemyName, hp: maxHp, maxHp: maxHp, ac: ac };
    
    document.getElementById("dnd-enemy-name").innerText = enemyName;
    document.getElementById("dnd-enemy-ac").innerText = `AC ${ac}`;
    document.getElementById("dnd-combat-card").classList.remove("hidden");
    
    logGameMsg(`⚠️ เริ่มต้นการต่อสู้กับ ${enemyName}! เตรียมตัวทอดเต๋าโจมตี`, "system");

    updateCombatStatus();
    loadCombatTurnOptions();
}

// Update Combat Side panel bars
function updateCombatStatus() {
    if (!dndActiveEnemy) return;

    document.getElementById("dnd-enemy-hp-txt").innerText = `${dndActiveEnemy.hp} / ${dndActiveEnemy.maxHp} HP`;
    const pct = (dndActiveEnemy.hp / dndActiveEnemy.maxHp) * 100;
    document.getElementById("dnd-enemy-hp-bar").style.width = `${pct}%`;

    // Shake enemy card on hit
    const enemyCard = document.getElementById("dnd-combat-card");
    enemyCard.classList.add("shake-panel");
    setTimeout(() => {
        enemyCard.classList.remove("shake-panel");
    }, 400);

    if (dndActiveEnemy.hp <= 0) {
        // Combat victory
        logGameMsg(`🎉 คุณเอาชนะ ${dndActiveEnemy.name} ได้สำเร็จ! การต่อสิ้นสุดลง`, "system");
        document.getElementById("dnd-combat-card").classList.add("hidden");
        dndActiveEnemy = null;
        loadDndScene("combat_victory");
    }
}

// Load combat action button options
function loadCombatTurnOptions() {
    const optionsContainer = document.getElementById("dnd-options");
    optionsContainer.innerHTML = "";

    // Choice A: Standard Weapon Attack
    const btnAttack = document.createElement("button");
    btnAttack.className = "dnd-choice-btn";
    btnAttack.style.borderColor = "rgba(239, 68, 68, 0.4)";
    btnAttack.style.color = "#fca5a5";
    
    // Get currently equipped weapon information
    const wInfo = dndWeaponsDb[dndPlayer.activeWeapon] || dndWeaponsDb.dagger;
    btnAttack.innerText = `⚔️ โจมตีด้วย ${wInfo.name} (${wInfo.desc})`;
    
    btnAttack.addEventListener("click", () => {
        // Trigger Attack Check vs Enemy AC using weapon main stat
        triggerD20Check(`Weapon Attack [${wInfo.name.split(" ")[0]}]`, {
            type: wInfo.stat.toUpperCase(),
            stat: wInfo.stat,
            dc: dndActiveEnemy.ac,
            success: dndCurrentSceneId,
            fail: dndCurrentSceneId
        });

        // Resolve attack callbacks
        activeDndCheck.success = () => {
            const result = rollWeaponDamage(dndPlayer.activeWeapon);
            
            dndActiveEnemy.hp = Math.max(0, dndActiveEnemy.hp - result.grandTotal);
            logGameMsg(`💥 โจมตีสำเร็จด้วย ${wInfo.name}! ทอดแต้มความเสียหายได้ ${result.diceText} (โบนัสโหมด ${result.modifier >= 0 ? '+' : ''}${result.modifier}) ➡️ สร้างความเสียหาย ${result.grandTotal} HP ให้กับ ${dndActiveEnemy.name}!`, "system");
            
            // Show floating damage popup effect
            createFloatingDamageEffect(result.grandTotal);
            updateCombatStatus();

            if (dndActiveEnemy) {
                setTimeout(enemyCombatTurn, 1200);
            }
        };
        activeDndCheck.fail = () => {
            logGameMsg(`🛡️ ทอยแต้มหลบเกราะพลาดเป้า (ต้องการ DC ${dndActiveEnemy.ac}) ของศัตรู การโจมตีด้วย ${wInfo.name.split(" ")[0]} พลาดเป้า!`, "system-fail");
            setTimeout(enemyCombatTurn, 1200);
        };
    });
    optionsContainer.appendChild(btnAttack);

    // Choice B: Cast Spell
    if (dndPlayer.spellSlotsMax > 0) {
        const btnSpell = document.createElement("button");
        btnSpell.className = "dnd-choice-btn";
        btnSpell.style.borderColor = "rgba(168, 85, 247, 0.4)";
        btnSpell.style.color = "#c084fc";
        
        let spellName = "Magic Missile (ลูกศรมนตรา)";
        if (dndPlayer.class === "cleric") spellName = "Guiding Bolt (ลำแสงสัจจะ)";
        btnSpell.innerText = `🔮 ร่ายเวทย์: ${spellName} (ต้องการ 1 สล็อต)`;

        btnSpell.addEventListener("click", () => {
            if (dndPlayer.spellSlots <= 0) {
                logGameMsg("คุณไม่มีสล็อตเวทมนตร์เหลืออยู่ในเทิร์นนี้! ต้องใช้การโจมตีธรรมดาแทน", "system");
                return;
            }
            
            dndPlayer.spellSlots--;
            updateDndHud();

            if (dndPlayer.class === "wizard") {
                // Magic missile hits automatically in D&D!
                const spellDmg = Math.floor(Math.random() * 4) + Math.floor(Math.random() * 4) + Math.floor(Math.random() * 4) + 3; // 3d4+3
                dndActiveEnemy.hp = Math.max(0, dndActiveEnemy.hp - spellDmg);
                logGameMsg(`✨ ร่ายคาถา Magic Missile! ลูกศรประกายแสงสีม่วงพุ่งเข้าชนร่างศัตรูโดยตรงโดยไม่มีการพลาดเป้า ➡️ สร้างดาเมจ ${spellDmg} HP!`, "system");
                createFloatingDamageEffect(spellDmg);
                updateCombatStatus();
                if (dndActiveEnemy) setTimeout(enemyCombatTurn, 1200);
            } else {
                // Guiding Bolt requires Spell Attack Check
                triggerD20Check("Guiding Bolt Spell Attack", {
                    type: "WIS",
                    stat: "wis",
                    dc: dndActiveEnemy.ac,
                    success: dndCurrentSceneId,
                    fail: dndCurrentSceneId
                });

                activeDndCheck.success = () => {
                    const spellDmg = Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6); // 4d6
                    dndActiveEnemy.hp = Math.max(0, dndActiveEnemy.hp - spellDmg);
                    logGameMsg(`✨ ลำแสง Guiding Bolt พุ่งชนเป้าหมายเข้ากลางหน้าอกกระแทกอย่างรุนแรง ➡️ สร้างดาเมจศักดิ์สิทธิ์ ${spellDmg} HP!`, "system");
                    createFloatingDamageEffect(spellDmg);
                    updateCombatStatus();
                    if (dndActiveEnemy) setTimeout(enemyCombatTurn, 1200);
                };
                activeDndCheck.fail = () => {
                    logGameMsg("🔮 ลำแสงเวทย์มนตร์บินเฉียดหูเป้าหมายและระเบิดเข้ากับเนื้อผนังข้างยาน!", "system-fail");
                    if (dndActiveEnemy) setTimeout(enemyCombatTurn, 1200);
                };
            }
        });
        optionsContainer.appendChild(btnSpell);
    }

    // Choice C: Drink Potion if have
    const hasPotion = dndPlayer.inventory.some(i => i.includes("ยา"));
    if (hasPotion) {
        const btnPot = document.createElement("button");
        btnPot.className = "dnd-choice-btn";
        btnPot.innerText = "🧪 ดื่มยาฟื้นฟูบาดแผล (Healing Potion)";
        btnPot.addEventListener("click", () => {
            const potionName = dndPlayer.inventory.find(i => i.includes("ยา"));
            useDndHealingPotion(potionName);
        });
        optionsContainer.appendChild(btnPot);
    }
}

// Enemy attacks player turn
function enemyCombatTurn() {
    if (!dndActiveEnemy) return;

    logGameMsg(`⚔️ เทิร์นของ ${dndActiveEnemy.name}: เตรียมจู่โจมสวนกลับ!`, "system");

    // Enemy attack roll
    setTimeout(() => {
        const roll = Math.floor(Math.random() * 20) + 1;
        const total = roll + 2; // enemy attack modifier
        
        // Choose target: 35% chance to hit Shadowheart if she is with you and has HP
        let targetComp = false;
        if (dndCompanion && dndCompanion.hp > 0 && Math.random() < 0.35) {
            targetComp = true;
        }

        const targetName = targetComp ? dndCompanion.name : dndPlayer.name;
        const targetAc = targetComp ? 15 : dndPlayer.ac; // Shadowheart has AC 15

        logGameMsg(`${dndActiveEnemy.name} ทอยจู่โจมใส่ ${targetName} ด้วยแต้มทอย ${roll} (+2) = ผลลัพธ์ ${total}`, "gm");

        if (total >= targetAc) {
            const damage = Math.floor(Math.random() * 6) + 1; // 1d6 damage
            
            if (targetComp) {
                dndCompanion.hp = Math.max(0, dndCompanion.hp - damage);
                logGameMsg(`💥 ศัตรูโจมตีโดน Shadowheart! เธอได้รับความเสียหาย ${damage} HP`, "system-fail");
                
                if (dndCompanion.hp <= 0) {
                    logGameMsg("💀 Shadowheart ได้รับความเสียหายรุนแรงจนหมดสติล้มลงและไม่สามารถช่วยคุณต่อสู้ได้!", "system-fail");
                    dndCompanion = null; // Removed from team
                }
            } else {
                dndPlayer.hp = Math.max(0, dndPlayer.hp - damage);
                logGameMsg(`💥 ศัตรูโจมตีโดนคุณ! คุณได้รับความเสียหาย ${damage} HP`, "system-fail");
                
                // Screen Shake Effect
                const gameCard = document.getElementById("dnd-game-panel");
                if (gameCard) {
                    gameCard.classList.add("shake-panel");
                    setTimeout(() => { gameCard.classList.remove("shake-panel"); }, 450);
                }
            }

            updateDndHud();
            
            if (dndPlayer.hp <= 0) {
                triggerDndGameOver();
                return;
            }
        } else {
            logGameMsg(`🛡️ การโจมตีปะทะโล่ป้องกันของ ${targetName} (AC ${targetAc}) พลาดเป้า!`, "system");
        }

        // Loop back options if still alive
        if (dndActiveEnemy) {
            loadCombatTurnOptions();
        }
    }, 1000);
}

// Floating Combat Text Damage Effect
function createFloatingDamageEffect(val) {
    const parent = document.getElementById("dnd-combat-card");
    if (!parent) return;

    const popup = document.createElement("div");
    popup.className = "floating-damage";
    popup.innerText = `-${val}`;
    
    // Position randomly on enemy avatar card area
    popup.style.top = "60px";
    popup.style.left = "110px";

    parent.appendChild(popup);
    
    setTimeout(() => {
        popup.remove();
    }, 850);
}

// Game Over Handler
function triggerDndGameOver() {
    logGameMsg("💀 คุณเสียชีวิตในสนามรบ! หนอนปรสิตเข้ายึดครองสมองและสติสัมปชัญญะของคุณอย่างสมบูรณ์แบบ... GAME OVER", "system-fail");
    
    const optionsContainer = document.getElementById("dnd-options");
    optionsContainer.innerHTML = "";
    
    const btnRestart = document.createElement("button");
    btnRestart.className = "dnd-choice-btn";
    btnRestart.style.borderColor = "#f43f5e";
    btnRestart.style.color = "#f43f5e";
    btnRestart.innerText = "🔄 คืนชีพและเริ่มต้นเกมใหม่ (Restart Game)";
    
    btnRestart.addEventListener("click", () => {
        dndPointPool = 27;
        dndPlayer.scores = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
        dndCompanion = null;
        dndActiveEnemy = null;
        document.getElementById("dnd-combat-card").classList.add("hidden");
        document.getElementById("dnd-game-panel").classList.add("hidden");
        document.getElementById("dnd-char-creator").classList.remove("hidden");
        refreshPointBuyUi();
    });
    optionsContainer.appendChild(btnRestart);
}




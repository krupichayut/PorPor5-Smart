import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Record a new star event for a student
 * @param {Object} data { studentId, classId, category, reasonCode, reasonText, note }
 */
export const awardStar = async (data) => {
  try {
    const starEventsRef = collection(db, 'starEvents');
    const eventDoc = {
      ...data,
      amount: 1,
      status: 'active',
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(starEventsRef, eventDoc);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error awarding star:", error);
    return { success: false, error };
  }
};

/**
 * Void a star event (e.g., clicked by mistake)
 * @param {string} eventId 
 * @param {string} voidReason 
 */
export const voidStar = async (eventId, voidReason = 'บันทึกผิดพลาด') => {
  try {
    const docRef = doc(db, 'starEvents', eventId);
    await updateDoc(docRef, {
      status: 'void',
      voidReason,
      voidedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error voiding star:", error);
    return { success: false, error };
  }
};

export const REASON_CATEGORIES = {
  RESPONSIBILITY: {
    id: 'responsibility',
    name: 'ความรับผิดชอบ',
    reasons: ['เตรียมอุปกรณ์พร้อม', 'ส่งงานตรงเวลา', 'รับผิดชอบหน้าที่', 'ดูแลอุปกรณ์ส่วนตัว', 'ดูแลอุปกรณ์ส่วนรวม']
  },
  EFFORT: {
    id: 'effort',
    name: 'ความพยายามและพัฒนาการ',
    reasons: ['ตั้งใจทำงาน', 'ไม่ยอมแพ้เมื่อพบปัญหา', 'พัฒนาผลงานจากครั้งก่อน', 'แก้ไขงานตามคำแนะนำ', 'ทำงานสำเร็จตามเป้าหมาย']
  },
  CREATIVITY: {
    id: 'creativity',
    name: 'ความคิดสร้างสรรค์',
    reasons: ['กล้าทดลองวิธีใหม่', 'มีแนวคิดสร้างสรรค์', 'ใช้วัสดุอย่างน่าสนใจ', 'ถ่ายทอดความคิดได้ชัดเจน', 'แก้ปัญหาด้วยตนเอง']
  },
  TEAMWORK: {
    id: 'teamwork',
    name: 'การอยู่ร่วมกับผู้อื่น',
    reasons: ['ช่วยเหลือเพื่อน', 'แบ่งปันอุปกรณ์', 'รับฟังความคิดเห็น', 'ทำงานร่วมกับผู้อื่นได้ดี', 'ให้กำลังใจเพื่อน']
  },
  CLASSROOM: {
    id: 'classroom',
    name: 'การดูแลห้องเรียน',
    reasons: ['ช่วยเก็บอุปกรณ์', 'รักษาความสะอาด', 'จัดพื้นที่ทำงานเรียบร้อย', 'ใช้วัสดุอย่างประหยัด', 'ช่วยดูแลผลงานส่วนรวม']
  }
};

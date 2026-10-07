import { collection, addDoc, doc, updateDoc, getDoc, runTransaction, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

// ==========================================
// REWARDS CATALOG MANAGEMENT
// ==========================================

export const addReward = async (data) => {
  try {
    const rewardsRef = collection(db, 'rewards');
    const rewardDoc = {
      ...data, // classId, name, description, imageUrl, constellationCost, stock, rewardType, isActive
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(rewardsRef, rewardDoc);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding reward:", error);
    return { success: false, error };
  }
};

export const updateReward = async (rewardId, data) => {
  try {
    const docRef = doc(db, 'rewards', rewardId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating reward:", error);
    return { success: false, error };
  }
};

// ==========================================
// REDEMPTIONS & TRANSACTIONS
// ==========================================

/**
 * Redeem a reward using a Firestore Transaction to ensure stock and constellation balances are valid.
 */
export const redeemReward = async (studentId, classId, rewardId, availableConstellations) => {
  try {
    const rewardRef = doc(db, 'rewards', rewardId);
    const redemptionsRef = collection(db, 'redemptions');
    const newRedemptionRef = doc(redemptionsRef); // Generate ID for new doc

    await runTransaction(db, async (transaction) => {
      // 1. Read the reward document
      const rewardDoc = await transaction.get(rewardRef);
      if (!rewardDoc.exists()) {
        throw new Error("ของรางวัลนี้ไม่มีอยู่ในระบบ");
      }

      const rewardData = rewardDoc.data();

      // 2. Check if reward is active
      if (!rewardData.isActive) {
        throw new Error("ของรางวัลนี้ถูกปิดการใช้งาน");
      }

      // 3. Check stock (if applicable)
      if (rewardData.stock !== null && rewardData.stock !== undefined) {
        if (rewardData.stock <= 0) {
          throw new Error("ของรางวัลนี้หมดสต็อกแล้ว");
        }
      }

      // 4. Check balance (Double check against client provided balance for safety)
      if (availableConstellations < rewardData.constellationCost) {
        throw new Error("กลุ่มดาวไม่เพียงพอสำหรับการแลกรางวัลนี้");
      }

      // 5. Update stock
      if (rewardData.stock !== null && rewardData.stock !== undefined) {
        transaction.update(rewardRef, {
          stock: rewardData.stock - 1,
          updatedAt: serverTimestamp()
        });
      }

      // 6. Create redemption record
      transaction.set(newRedemptionRef, {
        studentId,
        classId,
        rewardId,
        rewardNameSnapshot: rewardData.name,
        constellationCost: rewardData.constellationCost,
        status: 'pending', // pending, approved, waiting, received, cancelled
        requestedAt: serverTimestamp(),
      });
    });

    return { success: true, id: newRedemptionRef.id };
  } catch (error) {
    console.error("Transaction failed: ", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update the status of a redemption (e.g. approve, mark as received, or cancel)
 * If cancelling, and stock was tracked, we should refund the stock.
 */
export const updateRedemptionStatus = async (redemptionId, newStatus, rewardIdToRefund = null) => {
  try {
    const docRef = doc(db, 'redemptions', redemptionId);
    
    if (newStatus === 'cancelled' && rewardIdToRefund) {
      // Need a transaction to safely refund stock
      const rewardRef = doc(db, 'rewards', rewardIdToRefund);
      await runTransaction(db, async (transaction) => {
        const rewardDoc = await transaction.get(rewardRef);
        if (rewardDoc.exists() && rewardDoc.data().stock !== null) {
          transaction.update(rewardRef, {
            stock: rewardDoc.data().stock + 1
          });
        }
        transaction.update(docRef, {
          status: newStatus,
          updatedAt: serverTimestamp()
        });
      });
    } else {
      // Simple status update
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error updating redemption:", error);
    return { success: false, error };
  }
};

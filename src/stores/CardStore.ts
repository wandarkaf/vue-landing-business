import { ref } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'
import { db, collection } from '@/firebase'
import type { DocumentData, Unsubscribe } from 'firebase/firestore'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  documentId
} from 'firebase/firestore'

export const useCardStore = defineStore(
  'CardStore',
  () => {
    // state
    const card = ref<DocumentData>({})
    const cards = ref<DocumentData>([])
    const unsubscribes = ref<Unsubscribe[]>([])

    async function fetchCard(id: string) {
      const cardRef = await getDoc(doc(db, `cards/${id}`))
      const cardObject = { id: cardRef.id, ...cardRef.data() }
      card.value = cardObject
      return cardObject
    }

    async function fetchAllCards() {
      const unsubscribe = onSnapshot(collection(db, 'cards'), (doc) => {
        cards.value = doc.docs.map((doc) => {
          return { id: doc.id, ...doc.data() }
        })
      })
      unsubscribes.value = [...unsubscribes.value, unsubscribe]
    }

    async function fetchCards(ids: string[] | null) {
      const unsubscribe = onSnapshot(
        query(collection(db, 'cards'), where(documentId(), 'in', ids)),
        (doc) => {
          cards.value = doc.docs.map((doc) => {
            return { id: doc.id, ...doc.data() }
          })
        }
      )
      unsubscribes.value = [...unsubscribes.value, unsubscribe]
    }

    async function createCard(payload: any) {
      try {
        const usernameLower = payload.username.toLowerCase()
        const userRef = await setDoc(doc(db, 'users', payload.id), {
          ...payload,
          usernameLower,
          registerAt: serverTimestamp(),
          email: payload.email.toLowerCase()
        })
        // users.value = [...users.value.map((user: any) => user), { ...payload }]
        return userRef
      } catch (e) {
        console.error('Error adding document: ', e)
      }
    }

    async function upsertCard(id: string, payload: any) {
      const userRef = await doc(db, 'cards', id)
      try {
        await updateDoc(userRef, payload)
        // let user = users.value.find((user: any) => user.id === id)
        // user = { ...user, ...payload }
        // users.value = [...users.value.filter((user: any) => user.id !== id), user]
      } catch (e) {
        console.error('Error updating document: ', e)
      }
    }

    async function deleteCard(id: string) {
      const userRef = doc(db, 'users', id)
      try {
        await deleteDoc(userRef)
        // users.value = users.value.filter((user: any) => user.id !== id)
      } catch (e) {
        console.error('Error deleting document: ', e)
      }
    }

    function clearUnsubcribes() {
      unsubscribes.value.forEach((unsubcribe: Unsubscribe) => unsubcribe())
      unsubscribes.value = []
    }

    return {
      card,
      cards,
      fetchCard,
      fetchCards,
      fetchAllCards,
      createCard,
      upsertCard,
      deleteCard,
      clearUnsubcribes
    }
  },
  { historyEnabled: false }
)

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCardStore, import.meta.hot))
}

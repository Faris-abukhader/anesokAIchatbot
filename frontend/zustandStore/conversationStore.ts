import { GetOneUserConversationList } from "@anesok/server/module/coversation/conversation.handler";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Conversation = GetOneUserConversationList["conversationList"][0]
type ConversationStore = {
  isEmpty:boolean,
  conversationList:Conversation[] ;
  add: (
    newConversation: Conversation
  ) => void;
  extend:(conversationList:Conversation[])=>void
  getNewestConversationDate:()=> Date|undefined
  addMessage:(conversationId:number,content:string)=>void
};

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({
      isEmpty:true,
      conversationList: [],
      add(newConversation) {
        set({ isEmpty:false,conversationList: [newConversation, ...get().conversationList] });
      },
      extend(conversationList) {
        set({ isEmpty:false,conversationList: [...conversationList, ...get().conversationList] });
      },
      getNewestConversationDate() {
        const conversationList = get().conversationList;
        if (conversationList.length === 0) {
          return undefined;
        }
        const newestConversation = conversationList.reduce((newest, current) => {
          return current.createdAt > newest.createdAt ? current : newest;
        });
        return new Date(newestConversation.createdAt);
      },
      addMessage(conversationId, content) {
          get().conversationList.map(conversation=>{
            if(conversation.id==conversationId && conversation.messageList.length==0){
              let currentConversation = conversation
              currentConversation.messageList.push({
                userId: '',
                createdAt: new Date(),
                id: -1,
                conversationId,
                content,
                isAI: false        
              })
            }
            return conversation
          })
      },
    }),
    {
      name: "conversation-list",
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    }
  )
);

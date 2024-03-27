"use client"
import { Input } from "@anesok/components/ui/input";
import {
  SendMessageParams,
  sendMessageSchema,
} from "@anesok/server/module/message/message.schema";
import { api } from "@anesok/utils/api";
import { SendIcon } from "lucide-react";
import { useRouter } from "next/router";
import { memo, useEffect, useState } from "react";
import { parse } from "valibot";
import { usePendingMessageStore } from "zustandStore/PendingMessage";
import { useConversationStore } from "zustandStore/conversationStore";
import { useMessageStore } from "zustandStore/messageStore";
// import { usePendingMessageStore } from "../../MessageList";

// todo
// pass -1 for convesationId if there is not conversation exist
const MessageInput = ({
  userId,
  conversationId,
}: {
  userId: string;
  conversationId: number;
}) =>{
  const [message, setMessage] = useState<SendMessageParams>({
    userId,
    conversationId:Number(conversationId),
    content: "",
    isAI: false,
  });
  const {pendingMessage,setPendingMessage,setToSend} = usePendingMessageStore()
  const [disable, setDisable] = useState(true);
  const { push } = useRouter();
  const {send} = useMessageStore()
  const addMesage = useConversationStore(state=>state.addMessage)

  const { mutate: sendMessage, isLoading: isSendingMessage } =
    api.message.send.useMutation({
      onMutate() {
          setMessage(prevs=>({...prevs,content:''}))
      },
      onSuccess(data) {
        if(data.isAI)setPendingMessage('')
        send(data,conversationId)
        addMesage(conversationId,data.content)
      },
    });

  const {
    mutate: creatingConversation,
    isLoading: isCreatingConversation,
  } = api.conversation.create.useMutation({
    onSuccess(data) {
      // todo . . .
      // add message to zustand store before redirect

      // redirect to the new chat page
      push(`/chat/${data?.conversation.id}`);
    },
  });

  useEffect(() => {
    try {
      parse(sendMessageSchema, message);
      setDisable(false);
    } catch (err) {
      setDisable(true);
    }
  }, [message]);



  const fetchData = async () => {

    console.log('hello from fetchData')
    try {
      const response = await fetch('http://localhost:3000/api/message');
      if (!response.ok || !response.body) {
        throw response.statusText;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          setToSend(true)
          setTimeout(()=>{
            setPendingMessage('');
          },300)
          break;
        }
        const decodedChunk = decoder.decode(value, { stream: true });
        setPendingMessage(`${pendingMessage.content} ${decodedChunk}`);
      }
    } catch (error) {
      // Handle other errors
    }
  };
 
  const handleClick = () =>{
    if(conversationId == -1){
      creatingConversation(message)
    }else{
      sendMessage(message);
      fetchData()
    }
  }


  return (
    <div className="h-[10%] p-2 px-4">
      <div className="relative">
        <SendIcon
          aria-disabled={disable || isSendingMessage || isCreatingConversation || message.content.length<2}
          onClick={handleClick}
          className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 hover:cursor-pointer hover:text-orange-300"
        />
        <Input
          value={message.content}
          onChange={(val) =>
            setMessage((prevs) => ({ ...prevs, content: val.target.value }))
          }
          className="border-orange-500 pe-10 focus-visible:ring-1 focus-visible:ring-orange-500"
        />
      </div>
    </div>
  );
}

export default memo(MessageInput)
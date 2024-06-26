"use client"
import { Input } from "@anesok/components/ui/input";
import { OneUser } from "@anesok/server/module/auth/auth.handler";
import {
  SendMessageParams,
  sendMessageSchema,
} from "@anesok/server/module/message/message.schema";
import { api } from "@anesok/utils/api";
import { useClerk } from "@clerk/clerk-react";
import { SendIcon } from "lucide-react";
import { useRouter } from "next/router";
import { memo, useEffect, useState } from "react";
import { parse } from "valibot";
// import { usePendingMessageStore } from "zustandStore/PendingMessage";
import { useConversationStore } from "zustandStore/conversationStore";
import { useMessageStore } from "zustandStore/messageStore";

const MessageInput = ({
  user
}: {
  user:OneUser
  conversationId: number;
}) =>{
  // const {pendingMessage,setPendingMessage,setToSend} = usePendingMessageStore()
  const [disable, setDisable] = useState(true);
  const { push } = useRouter();
  const {send,setIsLoading,isLoading,conversationId} = useMessageStore()
  const addMesage = useConversationStore(state=>state.addMessage)
  const [message, setMessage] = useState<SendMessageParams>({
    userId:user.id,
    conversationId:Number(conversationId),
    content: "",
    isAI: false,
  });


  const { mutate: sendMessage, isLoading: isSendingMessage } =
    api.message.send.useMutation({
      onMutate() {
          setMessage(prevs=>({...prevs,content:''}))
      },
      onSuccess(data) {
        // if(data.isAI)setPendingMessage('')
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
      const messageContent = data.conversation.messageList[0]?.content
      if(!!messageContent)fetchData(messageContent,data.conversation.id)
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


  useEffect(()=>{
    setMessage(prevs=>({...prevs,conversationId:Number(conversationId)}))
  },[conversationId])

  const fetchData = async (question:string,conversationId:number) => {

    if(!question || question=='')return

    try {
      setIsLoading(true)

      setMessage(prevs=>({...prevs,content:''}))

      const body = JSON.stringify({
        question,
        session:{
          username:user.name.split(' ')[0],
          conversationID:Number(conversationId),
          relationShipStatus:user.relationShipStatus??'',
          workingStatus:user.workingStatus??'',
          bestFriendShortIntro:user.bestFriendShortIntro??''      
        }
      })


      const response = await fetch('http://127.0.0.1:8000/generate',{
        method:'POST',
        body,
        headers:{
          'Content-Type':'application/json'
        }
      });

      const data = await response.json()

      sendMessage({
        userId:user.id,
        conversationId:Number(conversationId),
        content:data,
        isAI:true
      })

      // const reader = response.body.getReader();
      // const decoder = new TextDecoder();

      // while (true) {
      //   const { value, done } = await reader.read();
      //   if (done) {
      //     setToSend(true)
      //     setTimeout(()=>{
      //       setPendingMessage('');
      //     },300)
      //     break;
      //   }
      //   const decodedChunk = decoder.decode(value, { stream: true });
      //   setPendingMessage(`${pendingMessage.content} ${decodedChunk}`);
      // }
    } catch (error) {
      console.log(error)
      // Handle other errors
    }

    setIsLoading(false)
  };
 
  const handleClick = () =>{
    if(conversationId == -1){
      creatingConversation(message)
    }else{
      sendMessage(message);
      fetchData(message.content,Number(conversationId))
    }
  }


  return (
    <div className="h-[10%] p-2 px-4">
      <div className="relative">
        <SendIcon
          aria-disabled={disable || isSendingMessage || isCreatingConversation || message.content.length<2 || isLoading}
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
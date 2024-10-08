import React, { useEffect, useState } from 'react';
import { ChatState } from '../Context/ChatProvider'
import { Box, FormControl, IconButton, Input, Spinner, Text, useToast } from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { getSender, getSenderFull } from '../config/ChatLogics';
import ProfileModal from './miscellaneous/ProfileModal';
import UpdateGroupChatModal from './miscellaneous/UpdateGroupChatModal';
import axios from 'axios';
import "./style.css";
import ScrollableChat from './ScrollableChat';
import io from "socket.io-client";
import Lottie from "react-lottie";
import animationData from "../animations/typing.json"

const ENDPOINT = "http://localhost:8080";
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {

    const { user, selectedChat, setSelectedChat, notification, setNotification } = ChatState();

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newMessage, setNewMessage] = useState();
    const [socketConnected, setSocketConnected] = useState(false);
    const [typing, setTyping] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    const toast = useToast();

    const defaultOptions = {
      loop: true,
      autoplay: true,
      animationData: animationData,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid slice",
      },
    };

    const fetchMessages = async () => {
      if(!selectedChat) return;

      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        setLoading(true);

        console.log("Fetching messages for Chat:", selectedChat);

        const { data } = await axios.get(`/api/message/${selectedChat._id}`, config);

        console.log("Fetched Messages: ", data);
        setMessages(data);
        setLoading(false);

        socket.emit("join chat", selectedChat._id);

      } catch (error) {
        toast({
            title: "Error Occured!",
            description: "Failed to Load the Message",
            status: "error",
            duration: 5000,
            isClosable: true,
            position: "bottom",
          });
          setLoading(false);
      }
    };

    useEffect(() => {
      socket = io(ENDPOINT);
      socket.emit("setup", user);
      socket.on("connected", () => setSocketConnected(true));
      socket.on("typing", () => setIsTyping(true));
      socket.on("stop typing", () => setIsTyping(false));
    }, []);

    useEffect(() => {
      fetchMessages();

      selectedChatCompare = selectedChat;
    }, [selectedChat]);

    useEffect(() => {
      socket.on("message recieved", (newMessageReceived) => {
        if(!selectedChatCompare || selectedChatCompare._id !== newMessageReceived.chat._id) {
          if(!notification.includes(newMessageReceived)) {
            setNotification([newMessageReceived, ...notification]);
          }
        } else {
          setMessages([...messages, newMessageReceived]);
          setFetchAgain(!fetchAgain);
        }
      });
    });

    const sendMessage = async (event) => {
      if(event.key === "Enter" && newMessage.trim()) {
        if(!selectedChat) {
          console.error("No Chat Selected");
          return;
        }
        socket.emit("stop typing", selectedChat._id);
        try {
          const config = {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user.token}`,
            },
          };

          console.log("Selected Chat for Sending:", selectedChat);

          setNewMessage("");

          const { data } = await axios.post("/api/message", {
            content: newMessage,
            chatId: selectedChat._id
          }, config);

          console.log("Message sent data: ", data);
          socket.emit("new message", data);
          setMessages((prevMessages) => [...prevMessages, data]);

        } catch (error) {
          toast({
            title: "Error Occured!",
            description: "Failed to send the Message",
            status: "error",
            duration: 5000,
            isClosable: true,
            position: "bottom",
          });
        }
      }
    };

    const typingHandler = (e) => {
      setNewMessage(e.target.value);

      // Typing Indicator Logic
      if(!socketConnected) return;

      if(!typing) {
        setTyping(true);
        socket.emit("typing", selectedChat._id);
      }
      let lastTypingTime = new Date().getTime();
      var timerLength = 3000;
      setTimeout(() => {
        var timeNow = new Date().getTime();
        var timeDiff = timeNow - lastTypingTime;

        if(timeDiff >= timerLength && typing) {
          socket.emit("stop typing", selectedChat._id);
          setTyping(false);
        }
      }, timerLength);
    };

  return (
    <>
      {
        selectedChat ? (
            <>
              <Text
                fontSize={{ base: "28px", md:"38px" }}
                pb={3}
                px={2}
                w="100%"
                display="flex"
                justifyContent={{ base: "space-between" }}
                alignItems="center"
              >
                <IconButton
                  display={{ base: "flex", md: "none" }}
                  icon={<ArrowBackIcon></ArrowBackIcon>}
                  onClick={() => setSelectedChat("")}
                ></IconButton>
                {!selectedChat.isGroupChat ? (
                    <>
                      {getSender(user, selectedChat.users)}
                      <ProfileModal user={getSenderFull(user, selectedChat.users)}></ProfileModal>
                    </>
                ) : (
                    <>
                      {selectedChat.chatName.toUpperCase()}
                      {<UpdateGroupChatModal fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} fetchMessages={fetchMessages}></UpdateGroupChatModal>}
                    </>
                )}
              </Text>
              <Box
                display="flex"
                flexDir="column"
                justifyContent="flex-end"
                p={3}
                bg="#E8E8E8"
                w="100%"
                h="100%"
                borderRadius="lg"
                overflowY="hidden"
              >
                {loading ? (
                  <Spinner
                    size="xl"
                    w={20}
                    h={20}
                    alignSelf="center"
                    margin="auto"
                  ></Spinner>
                ) : (
                  <div className='messages'>
                    <ScrollableChat messages={messages}></ScrollableChat>
                  </div>
                )}

                <FormControl onKeyDown={sendMessage} isRequired mt={3}>
                  {isTyping ? <div>
                    <Lottie
                      options={defaultOptions}
                      width={70}
                      style={{ marginBottom: 15, marginLeft: 0}}
                    ></Lottie>
                  </div> : <></>}
                  <Input
                    variant="filled"
                    bg="#E0E0E0"
                    placeholder='Enter a message..'
                    onChange={typingHandler}
                    value={newMessage}
                  ></Input>
                </FormControl>
              </Box>
            </>
        ) : (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              h="100%"
            >
                <Text
                  fontSize="3xl"
                  pb={3}
                  fontFamily="Work sans"
                >
                    Click on a user to start chatting
                </Text>
            </Box>
        )
      }
    </>
  )
}

export default SingleChat

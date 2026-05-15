import * as db from "../db";
import { createNotification } from "../db";
import type { InsertNotification } from "../../drizzle/schema";

export async function notifyTrade(userId: number, trade: any) {
  const message = `${trade.type} ${trade.quantity} ${trade.symbol} @ $${trade.entryPrice}`;
  
  await createNotification({
    userId,
    type: "trade",
    title: `Trade Executed: ${trade.symbol}`,
    message,
  } as InsertNotification);

  // Send Telegram notification
  if (trade.telegramChatId) {
    await sendTelegramNotification(trade.telegramBotToken, trade.telegramChatId, message);
  }

  // Send email notification
  if (trade.emailNotifications) {
    await sendEmailNotification(trade.email, `Trade Executed: ${trade.symbol}`, message);
  }
}

export async function notifyError(userId: number, error: string) {
  await createNotification({
    userId,
    type: "error",
    title: "Bot Error",
    message: error,
  } as InsertNotification);
}

export async function notifyMilestone(userId: number, title: string, message: string) {
  await createNotification({
    userId,
    type: "milestone",
    title,
    message,
  } as InsertNotification);
}

export async function notifyAlert(userId: number, title: string, message: string) {
  await createNotification({
    userId,
    type: "alert",
    title,
    message,
  } as InsertNotification);
}

async function sendTelegramNotification(botToken: string, chatId: string, message: string) {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });
    return response.ok;
  } catch (error) {
    console.error("Telegram notification failed:", error);
    return false;
  }
}

async function sendEmailNotification(email: string, subject: string, message: string) {
  try {
    // Integration with email service (SendGrid, Mailgun, etc.)
    // For now, just log it
    console.log(`Email to ${email}: ${subject} - ${message}`);
    return true;
  } catch (error) {
    console.error("Email notification failed:", error);
    return false;
  }
}

export async function getNotifications(userId: number) {
  return await db.getNotifications(userId);
}

export async function markAsRead(notificationId: number) {
  return await db.markNotificationAsRead(notificationId);
}

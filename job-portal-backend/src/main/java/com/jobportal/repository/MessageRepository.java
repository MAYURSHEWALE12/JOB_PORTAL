package com.jobportal.repository;

import com.jobportal.entity.Message;
import com.jobportal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    // Get full conversation between two users (ordered by time)
    @Query("SELECT m FROM Message m WHERE " +
            "(m.sender = :user1 AND m.receiver = :user2) OR " +
            "(m.sender = :user2 AND m.receiver = :user1) " +
            "ORDER BY m.sentAt ASC")
    List<Message> findConversation(
            @Param("user1") User user1,
            @Param("user2") User user2);

    // Get all messages received by user (for inbox)
    List<Message> findByReceiverOrderBySentAtDesc(User receiver);

    // Get all messages sent by user
    List<Message> findBySenderOrderBySentAtDesc(User sender);

    // Get unread message count for user
    long countByReceiverAndIsReadFalse(User receiver);

    // Get all unique users who have messaged with this user
    @Query("SELECT DISTINCT u FROM User u WHERE " +
            "u IN (SELECT m.sender FROM Message m WHERE m.receiver = :user) OR " +
            "u IN (SELECT m.receiver FROM Message m WHERE m.sender = :user)")
    List<User> findConversationPartners(@Param("user") User user);

    // Mark all messages from sender to receiver as read
    @Modifying
    @Transactional
    @Query("UPDATE Message m SET m.isRead = true WHERE m.sender = :sender AND m.receiver = :receiver AND m.isRead = false")
    void markAsRead(
            @Param("sender") User sender,
            @Param("receiver") User receiver);

    // Get latest message between two users
    @Query("SELECT m FROM Message m WHERE " +
            "(m.sender = :user1 AND m.receiver = :user2) OR " +
            "(m.sender = :user2 AND m.receiver = :user1) " +
            "ORDER BY m.sentAt DESC")
    List<Message> findLatestMessage(
            @Param("user1") User user1,
            @Param("user2") User user2);

    // Check if any message exists between two users
    @Query("SELECT COUNT(m) > 0 FROM Message m WHERE " +
            "(m.sender = :u1 AND m.receiver = :u2) OR " +
            "(m.sender = :u2 AND m.receiver = :u1)")
    boolean existsMessageBetweenUsers(@Param("u1") User u1, @Param("u2") User u2);

    // Delete all messages where user is sender or receiver
    void deleteBySenderOrReceiver(User sender, User receiver);

    // Get latest message per conversation partner in a single query
    @Query("SELECT m FROM Message m WHERE m.id IN (" +
            "SELECT MAX(m2.id) FROM Message m2 " +
            "WHERE (m2.sender = :user OR m2.receiver = :user) " +
            "GROUP BY " +
            "CASE WHEN m2.sender = :user THEN m2.receiver.id ELSE m2.sender.id END)")
    List<Message> findLatestMessagesPerPartner(@Param("user") User user);
}
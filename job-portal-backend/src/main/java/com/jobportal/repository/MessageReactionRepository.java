package com.jobportal.repository;

import com.jobportal.entity.MessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageReactionRepository extends JpaRepository<MessageReaction, Long> {

    @Query("SELECT mr FROM MessageReaction mr WHERE mr.message.id = :messageId ORDER BY mr.createdAt ASC")
    List<MessageReaction> findByMessageId(@Param("messageId") Long messageId);

    Optional<MessageReaction> findByMessageIdAndUserIdAndEmoji(Long messageId, Long userId, String emoji);

    @Modifying
    @Query("DELETE FROM MessageReaction mr WHERE mr.message.id = :messageId AND mr.user.id = :userId AND mr.emoji = :emoji")
    void deleteByMessageIdAndUserIdAndEmoji(@Param("messageId") Long messageId, @Param("userId") Long userId, @Param("emoji") String emoji);

    @Query("SELECT mr FROM MessageReaction mr WHERE mr.message.id IN :messageIds ORDER BY mr.createdAt ASC")
    List<MessageReaction> findByMessageIdIn(@Param("messageIds") List<Long> messageIds);
}

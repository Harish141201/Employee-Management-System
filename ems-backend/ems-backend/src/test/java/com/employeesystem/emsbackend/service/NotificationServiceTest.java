package com.employeesystem.emsbackend.service;

import com.employeesystem.emsbackend.entity.Notification;
import com.employeesystem.emsbackend.entity.NotificationType;
import com.employeesystem.emsbackend.entity.User;
import com.employeesystem.emsbackend.exception.ResourceNotFoundException;
import com.employeesystem.emsbackend.repository.NotificationRepository;
import com.employeesystem.emsbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private UserRepository userRepository;

    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(notificationRepository, userRepository);
    }

    private User user(long id) {
        User user = new User();
        user.setId(id);
        return user;
    }

    private Notification notification(long id, User owner) {
        Notification notification = new Notification();
        notification.setId(id);
        notification.setUser(owner);
        notification.setTitle("Leave approved");
        notification.setMessage("Your leave request was approved");
        notification.setType(NotificationType.INFO);
        return notification;
    }

    @Test
    void markRead_rejectsMarkingSomeoneElsesNotification() {
        Notification someoneElses = notification(1L, user(42L));
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(someoneElses));

        assertThatThrownBy(() -> notificationService.markRead(1L, 7L))
                .isInstanceOf(AccessDeniedException.class);
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void markRead_marksTheCallersOwnNotificationAsRead() {
        Notification own = notification(1L, user(7L));
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(own));
        when(notificationRepository.save(own)).thenReturn(own);

        notificationService.markRead(1L, 7L);

        assertThat(own.isRead()).isTrue();
        verify(notificationRepository).save(own);
    }

    @Test
    void markRead_throwsNotFoundForAnUnknownNotification() {
        when(notificationRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markRead(1L, 7L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void markAllRead_onlyTouchesTheCallersUnreadNotifications() {
        Notification first = notification(1L, user(7L));
        Notification second = notification(2L, user(7L));
        when(notificationRepository.findByUserIdAndReadFalse(7L)).thenReturn(List.of(first, second));

        notificationService.markAllRead(7L);

        assertThat(first.isRead()).isTrue();
        assertThat(second.isRead()).isTrue();
        ArgumentCaptor<List<Notification>> captor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).containsExactly(first, second);
    }

    @Test
    void notifyEmployee_doesNothingWhenTheEmployeeHasNoUserAccount() {
        when(userRepository.findByEmployeeId(5L)).thenReturn(Optional.empty());

        notificationService.notifyEmployee(5L, "Title", "Message", NotificationType.INFO);

        verify(notificationRepository, never()).save(any());
    }

    @Test
    void notifyEmployee_createsANotificationForTheLinkedUser() {
        User linkedUser = user(7L);
        when(userRepository.findByEmployeeId(5L)).thenReturn(Optional.of(linkedUser));

        notificationService.notifyEmployee(5L, "Leave approved", "Enjoy your time off", NotificationType.SUCCESS);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertThat(captor.getValue().getUser()).isSameAs(linkedUser);
        assertThat(captor.getValue().getTitle()).isEqualTo("Leave approved");
        assertThat(captor.getValue().getType()).isEqualTo(NotificationType.SUCCESS);
        assertThat(captor.getValue().getCreatedAt()).isNotNull();
    }

    @Test
    void unreadCount_delegatesToTheRepository() {
        when(notificationRepository.countByUserIdAndReadFalse(7L)).thenReturn(3L);

        assertThat(notificationService.unreadCount(7L)).isEqualTo(3L);
    }
}

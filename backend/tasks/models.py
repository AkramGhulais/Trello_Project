from django.db import models
from organizations.models import Organization
from projects.models import Project
from users.models import User


class Task(models.Model):
    STATUS_CHOICES = (
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
    )
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES,
        default='todo'
    )
    project = models.ForeignKey(
        Project, 
        on_delete=models.CASCADE, 
        related_name='tasks'
    )
    assignee = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        related_name='assigned_tasks',
        null=True,
        blank=True
    )
    organization = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE, 
        related_name='tasks'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class TaskComment(models.Model):
    """
    نموذج تعليقات المهام - يسمح للمستخدمين بإضافة تعليقات على المهام
    """
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='task_comments'
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_edited = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['created_at']
        
    def __str__(self):
        return f'تعليق بواسطة {self.author.username} على {self.task.title}'

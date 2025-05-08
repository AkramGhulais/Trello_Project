from django.db import models
from organizations.models import Organization
from users.models import User


class Project(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    owner = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='owned_projects'
    )
    organization = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE, 
        related_name='projects'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

"""Prompt text, kept out of the service code that sends it.

Prompts are reviewable content in a medical product, not implementation detail.
Keeping them in their own modules means a change to what the model is told shows
up as a diff a clinician or reviewer can read.
"""

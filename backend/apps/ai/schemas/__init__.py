"""Data contracts for the AI layer.

These are plain dataclasses rather than Django models on purpose: the AI layer
holds no state of its own. It receives verified data, produces text, and returns
both. Persistence belongs to the apps that own the data.
"""

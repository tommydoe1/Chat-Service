import express from 'express';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import getPrisma from '../lib/prisma.js';

const router = express.Router();
const prisma = getPrisma();

router.get('/conversations', authenticateJWT, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    res.json(conversations);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/conversations/:id', authenticateJWT, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    if (!req.params.id) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }
    
    const conversationId = parseInt(req.params.id);
    
    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    const conversation = await prisma.conversation.findFirst({
      where: { 
        id: conversationId,
        userId 
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (err) {
    console.error('Error fetching conversation:', err);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

router.delete('/conversations/:id', authenticateJWT, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    if (!req.params.id) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }
    
    const conversationId = parseInt(req.params.id);
    
    if (isNaN(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    const conversation = await prisma.conversation.findFirst({
      where: { 
        id: conversationId,
        userId 
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    await prisma.message.deleteMany({
      where: { conversationId }
    });

    await prisma.conversation.delete({
      where: { id: conversationId }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting conversation:', err);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

export default router;
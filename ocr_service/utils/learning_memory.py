"""
Learning Memory Module
Stores OCR corrections and auto-applies them in future extractions
"""

import json
import os

MEMORY_FILE = 'ocr_memory.json'


def load_memory():
    """Load corrections from memory file"""
    if os.path.exists(MEMORY_FILE):
        try:
            with open(MEMORY_FILE, 'r') as f:
                return json.load(f)
        except:
            return {'corrections': {}, 'party_names': [], 'company_names': []}
    return {'corrections': {}, 'party_names': [], 'company_names': []}


def save_memory(memory):
    """Save corrections to memory file"""
    with open(MEMORY_FILE, 'w') as f:
        json.dump(memory, f, indent=2)


def apply_corrections(text, memory):
    """Apply learned corrections to OCR text"""
    corrections = memory.get('corrections', {})
    
    for wrong, right in corrections.items():
        text = text.replace(wrong, right)
    
    return text


def learn_correction(wrong_text, correct_text, field_type=None):
    """Learn a new correction"""
    memory = load_memory()
    
    if wrong_text and correct_text and wrong_text != correct_text:
        memory['corrections'][wrong_text] = correct_text
        
        # Also learn party/company names for autocomplete
        if field_type == 'party_name' and correct_text not in memory['party_names']:
            memory['party_names'].append(correct_text)
        elif field_type == 'company_name' and correct_text not in memory['company_names']:
            memory['company_names'].append(correct_text)
        
        save_memory(memory)
        return True
    
    return False


def get_suggestions(field_type, prefix, memory):
    """Get autocomplete suggestions based on learned data"""
    if field_type == 'party_name':
        names = memory.get('party_names', [])
        return [n for n in names if n.lower().startswith(prefix.lower())] if prefix else names[:10]
    elif field_type == 'company_name':
        names = memory.get('company_names', [])
        return [n for n in names if n.lower().startswith(prefix.lower())] if prefix else names[:10]
    
    return []


def get_corrections():
    """Get all learned corrections"""
    memory = load_memory()
    return memory.get('corrections', {})


def clear_memory():
    """Clear all learned corrections"""
    save_memory({'corrections': {}, 'party_names': [], 'company_names': []})

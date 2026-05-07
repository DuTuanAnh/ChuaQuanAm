import type { SchemaTypeDefinition } from 'sanity';

import dharma from './dharma';
import event from './event';
import photo from './photo';
import post from './post';

export const schemaTypes: SchemaTypeDefinition[] = [post, dharma, event, photo];

import { ComponentType } from 'react';
import { withLayoutBasic } from './LayoutBasic';

export default function withLayoutHome<P extends object>(Page: ComponentType<P>) {
	return withLayoutBasic(Page, 'CreatorHub');
}

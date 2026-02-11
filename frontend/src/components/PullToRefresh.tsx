'use client'

import { ReactNode } from 'react'
import PullToRefreshComponent from 'react-simple-pull-to-refresh'
import { LoadingSpinner } from './ui/Loading'

interface PullToRefreshProps {
    onRefresh: () => Promise<void>
    children: ReactNode
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
    return (
        <PullToRefreshComponent
            onRefresh={onRefresh}
            pullingContent={
                <div className="flex justify-center items-center py-4">
                    <div className="text-muted-foreground text-sm">↓ Desliza para actualizar</div>
                </div>
            }
            refreshingContent={
                <div className="flex justify-center items-center py-4">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2 text-muted-foreground text-sm">Actualizando...</span>
                </div>
            }
            pullDownThreshold={80}
            maxPullDownDistance={120}
            resistance={2}
        >
            <>{children}</>
        </PullToRefreshComponent>
    )
}

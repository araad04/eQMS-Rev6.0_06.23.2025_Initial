
import { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  Connection,
  addEdge,
  NodeChange,
  EdgeChange,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

const nodeTypes = {
  task: ({ data }: any) => (
    <div className="px-4 py-2 shadow-lg rounded-md bg-white border-2 border-gray-200">
      <div className="font-bold">{data.label}</div>
    </div>
  ),
};

export default function ProcessFlowDesigner() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const addNewNode = useCallback(() => {
    const newNode: Node = {
      id: `node-${nodes.length + 1}`,
      data: { label: `Task ${nodes.length + 1}` },
      position: { x: 100, y: 100 },
      type: 'task',
    };
    setNodes((nds) => [...nds, newNode]);
  }, [nodes, setNodes]);

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
      >
        <Background />
        <Controls />
        <Panel position="top-right">
          <Button onClick={addNewNode} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Task
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  );
}

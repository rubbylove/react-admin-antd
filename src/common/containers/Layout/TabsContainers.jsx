// 自定义新增页签触发器
import React from 'react'
import { cloneDeep } from 'lodash' // isArray
import { hasString } from '../../../utils'

import { Tabs } from 'antd' // Button
const TabPane = Tabs.TabPane

class TabsContainers extends React.Component {
    state = {
        activeKey: '', // 默认值: panes[0].key
        panes: [] // 默认值: [{ route, tabsProps, key }]
    }

    // 切换面板的回调 => 切换 state.activeKey
    onChange = (activeKey) => {
        // this.setState({ activeKey })
        console.log('activeKey' + activeKey)
    }

    // 新增和删除页签的回调
    onEdit = (targetKey, action) => {
        this[action](targetKey)
    }

    // 获取 rootState 中的 url信息
    selectUrl = (state) => {
        return state.route.path
    }

    // 判断 标签显示条件
    handleChange = () => {
        console.log(this)
        const arrayPanes = this.props.panesState.panes // 获取 store当中的 panes数组
        const strUrl = this.selectUrl(this.props) // 根据当前路由状态 获取 url字符串

        // 判断数组中是否有此 字符串
        if (hasString(arrayPanes, strUrl)) {
            console.log('无 当前url')

            // setState 配置
            let currentPanes = this.setPanes(this.setCloneObj())
            this.setActions(`${arrayPanes.length + 1}`, currentPanes)
        } else {
            console.log('有 当前url')
        }
    }

    // 配置 actions / 发起 actions
    setActions = (numKey, arrPanes) => {
        this.props.onAddPane({
            activeKey: numKey,
            panes: arrPanes
        })
    }

    // 配置 深拷贝的 cloneObj
    setCloneObj = () => {
        // 深拷贝 route 与 tabsPropss 组成的对象
        let cloneObj = cloneDeep({
            key: `${this.props.panesState.panes.length + 1}`,
            title: this.props.route.title,
            path: this.props.route.path
        })

        return cloneObj
    }

    // 配置 store.state.panes
    setPanes = (cloneObj) => {
        return cloneDeep([...this.state.panes, cloneObj])
    }

    // 配置 activeKey(设置显示 当前active 标签)
    setActiveKey = () => {

    }

    // 删减 / 关闭 单个 Tabs标签 => 也应该修改 LS中的数组 & Redux 中的数据
    remove = (targetKey) => {
        console.log('关闭 Tabs')
    }

    // render 渲染之前
    componentWillMount = () => {
        this.handleChange()
    }

    // 当 props改变时 触发 => 调用 更改 setState的方法
    componentWillReceiveProps = (nextProps) => {
        console.log('store 发生改变')
        let currentState = cloneDeep(nextProps.panesState)
        this.setState(currentState)
    }

    render () {
        const { route, tabsProps } = this.props
        return (
            <Tabs
                hideAdd
                onChange={ this.onChange } // 切换面板的回调
                activeKey={ this.state.activeKey } // 当前激活 tab 面板的 key
                type="editable-card" // 页签的基本样式
                onEdit={ this.onEdit } // 新增和删除页签的回调
            >
                {/* 内容部分 与 state.panes数组无关系 */}
                {
                    this.state.panes.map((pane) => (
                        <TabPane
                            key={ pane.key } // this.state.activeKey // 与 store中的 panesState 绑定
                            tab={ pane.title }
                            path={ pane.path }
                        >
                            <route.component { ...tabsProps } routes={route.routes} />
                        </TabPane>
                    ))
                }
            </Tabs>
        )
    }
}

export default TabsContainers

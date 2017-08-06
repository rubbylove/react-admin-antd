// 物业管理 - 目录配置
const PROPERTY_DIR = {
    title: '物业管理',
    key: 'property',
    path: '/home/property',
    icon: 'folder',
    childRoute: [
        {
            title: '物业合同',
            key: 'contract',
            path: '/home/property/contract',
            ancestor: ['property'],
            component: require('./containers/Contract').default
        }, {
            title: '物业费管理',
            key: 'propertyFee',
            path: '/home/property/propertyFee',
            ancestor: ['property'],
            component: require('./containers/PropertyFee').default
        }, {
            title: '电费管理',
            key: 'electricCharge',
            path: '/home/property/electricCharge',
            ancestor: ['property'],
            component: require('./containers/ElectricCharge').default
        }, {
            title: '水费管理',
            key: 'waterCharge',
            path: '/home/property/waterCharge',
            ancestor: ['property'],
            component: require('./containers/WaterCharge').default
        }
    ]
}

export default PROPERTY_DIR
